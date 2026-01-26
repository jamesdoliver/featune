"""Audio watermarking service.

Uses pydub to overlay a voice tag onto audio files at specified positions.
Requires ffmpeg to be installed on the system.
"""

import os
import tempfile
from pathlib import Path

from pydub import AudioSegment

# Default voice tag path — can be overridden via VOICE_TAG_PATH env var.
DEFAULT_VOICE_TAG_PATH = str(
    Path(__file__).resolve().parent.parent.parent / "assets" / "voice_tag.mp3"
)
VOICE_TAG_PATH = os.environ.get("VOICE_TAG_PATH", DEFAULT_VOICE_TAG_PATH)


def _load_audio(audio_path: str) -> AudioSegment:
    """Load an audio file, auto-detecting format from the file extension.

    Args:
        audio_path: Path to the audio file.

    Returns:
        A pydub AudioSegment.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the format is unsupported.
    """
    if not os.path.isfile(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    ext = Path(audio_path).suffix.lower().lstrip(".")
    supported = {"mp3", "wav", "ogg", "flac", "m4a", "aac"}
    if ext not in supported:
        raise ValueError(
            f"Unsupported audio format '.{ext}'. Supported: {', '.join(sorted(supported))}"
        )

    return AudioSegment.from_file(audio_path, format=ext)


def _load_voice_tag(tag_path: str | None = None) -> AudioSegment:
    """Load the voice tag audio file.

    Args:
        tag_path: Optional override path. Falls back to VOICE_TAG_PATH.

    Returns:
        A pydub AudioSegment for the voice tag.

    Raises:
        FileNotFoundError: If the voice tag file is missing.
    """
    path = tag_path or VOICE_TAG_PATH
    if not os.path.isfile(path):
        raise FileNotFoundError(
            f"Voice tag file not found: {path}. "
            "Place a voice_tag.mp3 in backend/assets/ or set VOICE_TAG_PATH."
        )
    ext = Path(path).suffix.lower().lstrip(".")
    return AudioSegment.from_file(path, format=ext)


def watermark_audio(
    audio_path: str,
    tag_path: str,
    positions: list[int],
) -> str:
    """Overlay a voice tag on an audio file at specified positions.

    Args:
        audio_path: Path to the source audio file.
        tag_path: Path to the voice tag audio file.
        positions: List of positions (in seconds) where the tag should be
            overlaid onto the audio.

    Returns:
        Path to the watermarked output file (MP3, in a temp directory).
    """
    audio = _load_audio(audio_path)
    tag = _load_voice_tag(tag_path)

    for pos_seconds in positions:
        pos_ms = pos_seconds * 1000
        # Only overlay if the position is within the audio duration
        if pos_ms < len(audio):
            audio = audio.overlay(tag, position=pos_ms)

    output_fd, output_path = tempfile.mkstemp(suffix=".mp3")
    os.close(output_fd)
    audio.export(output_path, format="mp3")
    return output_path


def create_full_preview(
    audio_path: str,
    tag_path: str,
) -> str:
    """Create a full-length watermarked preview of an audio file.

    The voice tag is overlaid every 15-20 seconds. The implementation uses a
    17-second interval (midpoint of the 15-20 range) for consistent spacing.

    Args:
        audio_path: Path to the source audio file (MP3).
        tag_path: Path to the voice tag audio file.

    Returns:
        Path to the full-length watermarked output file (MP3).
    """
    audio = _load_audio(audio_path)
    duration_seconds = len(audio) / 1000.0
    interval = 17  # seconds — midpoint of 15-20s range

    positions: list[int] = []
    pos = interval
    while pos < duration_seconds:
        positions.append(pos)
        pos += interval

    # If the audio is very short, ensure at least one watermark
    if not positions and duration_seconds > 5:
        positions.append(int(duration_seconds / 2))

    tag = _load_voice_tag(tag_path)
    for p in positions:
        pos_ms = p * 1000
        if pos_ms < len(audio):
            audio = audio.overlay(tag, position=pos_ms)

    output_fd, output_path = tempfile.mkstemp(suffix=".mp3")
    os.close(output_fd)
    audio.export(output_path, format="mp3")
    return output_path


def create_clip_preview(
    audio_path: str,
    tag_path: str,
    start_seconds: int,
    duration: int = 30,
) -> str:
    """Extract a clip and watermark it for preview purposes.

    Extracts a segment starting at *start_seconds* for *duration* seconds, then
    overlays the voice tag at 10 s and 24 s into the clip.

    Args:
        audio_path: Path to the source audio file (MP3).
        tag_path: Path to the voice tag audio file.
        start_seconds: Where in the source to begin the clip (seconds).
        duration: Length of the clip in seconds (default 30).

    Returns:
        Path to the clipped and watermarked output file (MP3).
    """
    audio = _load_audio(audio_path)

    start_ms = start_seconds * 1000
    end_ms = start_ms + (duration * 1000)

    # Clamp end to actual audio length
    end_ms = min(end_ms, len(audio))

    clip = audio[start_ms:end_ms]

    tag = _load_voice_tag(tag_path)

    # Watermark at 10s and 24s into the clip
    watermark_positions_ms = [10 * 1000, 24 * 1000]
    for pos_ms in watermark_positions_ms:
        if pos_ms < len(clip):
            clip = clip.overlay(tag, position=pos_ms)

    output_fd, output_path = tempfile.mkstemp(suffix=".mp3")
    os.close(output_fd)
    clip.export(output_path, format="mp3")
    return output_path
