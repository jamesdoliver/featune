"""Audio processing router.

Exposes endpoints for:
- Full upload processing (watermark + clip + waveform)
- Standalone watermarking
- Standalone waveform generation
"""

import asyncio
import json
import logging
import os
import tempfile
import uuid
from typing import Annotated

logger = logging.getLogger(__name__)

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from supabase import create_client, Client

from app.services.watermark import (
    VOICE_TAG_PATH,
    create_clip_preview,
    create_full_preview,
    watermark_audio,
)
from app.services.waveform import generate_waveform

router = APIRouter()


_supabase_client: Client | None = None


def _get_supabase() -> Client:
    """Get a cached Supabase client using service role credentials."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        _supabase_client = create_client(url, key)
    except Exception:
        logger.exception("Failed to create Supabase client")
        raise HTTPException(status_code=503, detail="Supabase client initialization failed")
    return _supabase_client


def _upload_to_supabase(file_path: str, bucket: str, object_path: str) -> str:
    """Upload a file to Supabase Storage and return its public URL.

    Args:
        file_path: Local path to the file to upload.
        bucket: Supabase Storage bucket name.
        object_path: Path within the bucket for the uploaded file.

    Returns:
        Public URL of the uploaded file.
    """
    supabase = _get_supabase()
    with open(file_path, "rb") as f:
        supabase.storage.from_(bucket).upload(
            object_path, f, {"content-type": "audio/mpeg", "upsert": "true"}
        )
    return supabase.storage.from_(bucket).get_public_url(object_path)


MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_PREVIEW_CLIP_START = 600  # 10 minutes – sanity cap
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/wave", "audio/x-pn-wav", "audio/aiff", "audio/x-aiff",
    "audio/flac", "audio/ogg", "application/octet-stream",
}


def _validate_upload(upload: UploadFile) -> None:
    """Validate file MIME type. Raises HTTPException on failure."""
    content_type = (upload.content_type or "").lower()
    if content_type and content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {content_type}. Upload an audio file.",
        )


async def _save_upload_to_temp(upload: UploadFile, suffix: str = ".mp3") -> str:
    """Persist an uploaded file to a temporary location on disk.

    Args:
        upload: The incoming UploadFile from FastAPI.
        suffix: File extension for the temp file.

    Returns:
        Absolute path to the saved temporary file.
    """
    _validate_upload(upload)

    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    try:
        content = await upload.read()
        if len(content) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024 * 1024)} MB.",
            )
        with os.fdopen(fd, "wb") as f:
            f.write(content)
    except HTTPException:
        os.close(fd)
        os.unlink(tmp_path)
        raise
    except Exception:
        os.close(fd)
        raise
    return tmp_path


# ---------------------------------------------------------------------------
# POST /upload — full upload processing pipeline
# ---------------------------------------------------------------------------
@router.post("/upload")
async def process_upload(
    listening_file: Annotated[UploadFile, File(description="Source MP3 file")],
    preview_clip_start: Annotated[int, Form()] = 0,
    track_id: Annotated[str | None, Form()] = None,
) -> JSONResponse:
    """Run the full upload processing pipeline.

    1. Save the uploaded listening file to a temp directory.
    2. Generate a full-length watermarked preview.
    3. Generate a 30-second watermarked clip preview.
    4. Generate waveform data.

    Returns a JSON object with paths/data for each artefact.
    """
    # Validate preview_clip_start
    if preview_clip_start < 0 or preview_clip_start > MAX_PREVIEW_CLIP_START:
        raise HTTPException(
            status_code=422,
            detail=f"preview_clip_start must be between 0 and {MAX_PREVIEW_CLIP_START}",
        )

    # Validate track_id if provided
    if track_id is not None:
        try:
            uuid.UUID(track_id)
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail="track_id must be a valid UUID",
            )

    # Determine file suffix from the uploaded filename
    original_name = listening_file.filename or "upload.mp3"
    suffix = os.path.splitext(original_name)[1] or ".mp3"

    tmp_path: str | None = None
    full_preview_path: str | None = None
    clip_preview_path: str | None = None

    try:
        tmp_path = await _save_upload_to_temp(listening_file, suffix=suffix)
        tag_path = VOICE_TAG_PATH

        # Full watermarked preview (run in thread to avoid blocking event loop)
        try:
            full_preview_path = await asyncio.to_thread(
                create_full_preview, tmp_path, tag_path
            )
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Watermark processing error: {exc}",
            ) from exc

        # 30-second clip preview
        try:
            clip_preview_path = await asyncio.to_thread(
                create_clip_preview,
                tmp_path, tag_path, start_seconds=preview_clip_start, duration=30,
            )
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Clip processing error: {exc}",
            ) from exc

        # Waveform data
        try:
            waveform_data = await asyncio.to_thread(generate_waveform, tmp_path)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Waveform generation error: {exc}",
            ) from exc

        # Upload previews to Supabase Storage
        actual_track_id = track_id or str(uuid.uuid4())

        full_preview_url = None
        if full_preview_path:
            full_preview_url = _upload_to_supabase(
                full_preview_path, "previews", f"{actual_track_id}/full_preview.mp3"
            )

        clip_preview_url = None
        if clip_preview_path:
            clip_preview_url = _upload_to_supabase(
                clip_preview_path, "previews", f"{actual_track_id}/preview_clip.mp3"
            )

        return JSONResponse(
            content={
                "full_preview_url": full_preview_url,
                "preview_clip_url": clip_preview_url,
                "waveform_data": waveform_data,
            }
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Upload processing failed: {exc}",
        ) from exc
    finally:
        # Clean up all temp files (originals and generated previews)
        for path in [tmp_path, full_preview_path, clip_preview_path]:
            if path and os.path.isfile(path):
                os.unlink(path)


# ---------------------------------------------------------------------------
# POST /watermark — standalone watermark endpoint
# ---------------------------------------------------------------------------
@router.post("/watermark")
async def process_watermark(
    audio_file: Annotated[UploadFile, File(description="Audio file to watermark")],
    positions: Annotated[str, Form(description="JSON array of positions in seconds, e.g. [10, 24]")],
    background_tasks: BackgroundTasks,
) -> FileResponse:
    """Watermark an audio file at the specified positions.

    Accepts:
        audio_file: The audio file to watermark.
        positions: A JSON-encoded list of integers representing seconds where
            the voice tag should be overlaid.

    Returns:
        The watermarked audio file as a downloadable MP3.
    """
    # Parse positions
    try:
        positions_list: list[int] = json.loads(positions)
        if not isinstance(positions_list, list) or not all(
            isinstance(p, int) for p in positions_list
        ):
            raise ValueError
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=422,
            detail="positions must be a JSON array of integers, e.g. [10, 24]",
        )

    original_name = audio_file.filename or "audio.mp3"
    suffix = os.path.splitext(original_name)[1] or ".mp3"

    tmp_path: str | None = None
    try:
        tmp_path = await _save_upload_to_temp(audio_file, suffix=suffix)
        tag_path = VOICE_TAG_PATH

        output_path = await asyncio.to_thread(
            watermark_audio, tmp_path, tag_path, positions_list
        )

        # Defer cleanup until after the response has been streamed
        def _cleanup() -> None:
            for p in [tmp_path, output_path]:
                if p and os.path.isfile(p):
                    os.unlink(p)

        background_tasks.add_task(_cleanup)

        return FileResponse(
            path=output_path,
            media_type="audio/mpeg",
            filename=f"watermarked_{original_name}",
        )
    except FileNotFoundError as exc:
        if tmp_path and os.path.isfile(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        if tmp_path and os.path.isfile(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(
            status_code=500,
            detail=f"Watermarking failed: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# POST /waveform — standalone waveform endpoint
# ---------------------------------------------------------------------------
@router.post("/waveform")
async def process_waveform(
    audio_file: Annotated[UploadFile, File(description="Audio file to analyse")],
) -> JSONResponse:
    """Generate waveform amplitude data from an audio file.

    Returns a JSON object containing a list of normalised float values.
    """
    original_name = audio_file.filename or "audio.mp3"
    suffix = os.path.splitext(original_name)[1] or ".mp3"

    tmp_path: str | None = None
    try:
        tmp_path = await _save_upload_to_temp(audio_file, suffix=suffix)

        waveform_data = await asyncio.to_thread(generate_waveform, tmp_path)

        return JSONResponse(content={"waveform_data": waveform_data})
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Waveform generation failed: {exc}",
        ) from exc
    finally:
        if tmp_path and os.path.isfile(tmp_path):
            os.unlink(tmp_path)
