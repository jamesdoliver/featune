"""Audio processing router.

Exposes endpoints for:
- Full upload processing (watermark + clip + waveform)
- Standalone watermarking
- Standalone waveform generation
"""

import json
import os
import tempfile
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from app.services.watermark import (
    VOICE_TAG_PATH,
    create_clip_preview,
    create_full_preview,
    watermark_audio,
)
from app.services.waveform import generate_waveform

router = APIRouter()


async def _save_upload_to_temp(upload: UploadFile, suffix: str = ".mp3") -> str:
    """Persist an uploaded file to a temporary location on disk.

    Args:
        upload: The incoming UploadFile from FastAPI.
        suffix: File extension for the temp file.

    Returns:
        Absolute path to the saved temporary file.
    """
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    try:
        content = await upload.read()
        with os.fdopen(fd, "wb") as f:
            f.write(content)
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
) -> JSONResponse:
    """Run the full upload processing pipeline.

    1. Save the uploaded listening file to a temp directory.
    2. Generate a full-length watermarked preview.
    3. Generate a 30-second watermarked clip preview.
    4. Generate waveform data.

    Returns a JSON object with paths/data for each artefact.
    """
    # Determine file suffix from the uploaded filename
    original_name = listening_file.filename or "upload.mp3"
    suffix = os.path.splitext(original_name)[1] or ".mp3"

    tmp_path: str | None = None
    full_preview_path: str | None = None
    clip_preview_path: str | None = None

    try:
        tmp_path = await _save_upload_to_temp(listening_file, suffix=suffix)
        tag_path = VOICE_TAG_PATH

        # Full watermarked preview
        try:
            full_preview_path = create_full_preview(tmp_path, tag_path)
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Watermark processing error: {exc}",
            ) from exc

        # 30-second clip preview
        try:
            clip_preview_path = create_clip_preview(
                tmp_path, tag_path, start_seconds=preview_clip_start, duration=30
            )
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Clip processing error: {exc}",
            ) from exc

        # Waveform data
        try:
            waveform_data = generate_waveform(tmp_path)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Waveform generation error: {exc}",
            ) from exc

        return JSONResponse(
            content={
                "full_preview_path": full_preview_path,
                "clip_preview_path": clip_preview_path,
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
        # Clean up the uploaded temp file (keep output files for caller)
        if tmp_path and os.path.isfile(tmp_path):
            os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# POST /watermark — standalone watermark endpoint
# ---------------------------------------------------------------------------
@router.post("/watermark")
async def process_watermark(
    audio_file: Annotated[UploadFile, File(description="Audio file to watermark")],
    positions: Annotated[str, Form(description="JSON array of positions in seconds, e.g. [10, 24]")],
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

        output_path = watermark_audio(tmp_path, tag_path, positions_list)

        return FileResponse(
            path=output_path,
            media_type="audio/mpeg",
            filename=f"watermarked_{original_name}",
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Watermarking failed: {exc}",
        ) from exc
    finally:
        if tmp_path and os.path.isfile(tmp_path):
            os.unlink(tmp_path)


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

        waveform_data = generate_waveform(tmp_path)

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
