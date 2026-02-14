"""Tests for upload validation logic in the process router."""

import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.routers.process import (
    _validate_upload,
    ALLOWED_AUDIO_TYPES,
    MAX_UPLOAD_SIZE,
    MAX_PREVIEW_CLIP_START,
)


def _make_upload(content_type: str | None) -> MagicMock:
    """Create a mock UploadFile with the given content_type."""
    mock = MagicMock()
    mock.content_type = content_type
    return mock


class TestValidateUploadAllowedTypes:
    """_validate_upload should accept all recognised audio MIME types."""

    @pytest.mark.parametrize(
        "mime_type",
        [
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "audio/x-wav",
            "audio/wave",
            "audio/x-pn-wav",
            "audio/aiff",
            "audio/x-aiff",
            "audio/flac",
            "audio/ogg",
        ],
    )
    def test_allows_standard_audio_types(self, mime_type: str):
        """Standard audio MIME types should not raise an exception."""
        upload = _make_upload(mime_type)
        # Should not raise
        _validate_upload(upload)

    def test_allows_application_octet_stream(self):
        """application/octet-stream (generic binary) should be accepted."""
        upload = _make_upload("application/octet-stream")
        _validate_upload(upload)


class TestValidateUploadRejectedTypes:
    """_validate_upload should reject non-audio MIME types with 415."""

    @pytest.mark.parametrize(
        "mime_type",
        [
            "text/plain",
            "application/json",
            "image/png",
            "image/jpeg",
            "video/mp4",
            "application/pdf",
        ],
    )
    def test_rejects_non_audio_types(self, mime_type: str):
        """Non-audio MIME types should raise HTTPException with status 415."""
        upload = _make_upload(mime_type)
        with pytest.raises(HTTPException) as exc_info:
            _validate_upload(upload)
        assert exc_info.value.status_code == 415
        assert "Unsupported file type" in exc_info.value.detail


class TestValidateUploadEmptyContentType:
    """_validate_upload should allow uploads with empty or None content_type."""

    def test_allows_none_content_type(self):
        """None content_type (no MIME sent by client) should be accepted."""
        upload = _make_upload(None)
        _validate_upload(upload)

    def test_allows_empty_string_content_type(self):
        """Empty string content_type should be accepted."""
        upload = _make_upload("")
        _validate_upload(upload)


class TestUploadConstants:
    """Verify upload-related constants have the expected values."""

    def test_max_upload_size_is_100mb(self):
        """MAX_UPLOAD_SIZE should be exactly 100 MB."""
        assert MAX_UPLOAD_SIZE == 100 * 1024 * 1024
        assert MAX_UPLOAD_SIZE == 104_857_600

    def test_max_preview_clip_start_is_600(self):
        """MAX_PREVIEW_CLIP_START should be 600 seconds (10 minutes)."""
        assert MAX_PREVIEW_CLIP_START == 600

    def test_allowed_audio_types_is_complete(self):
        """ALLOWED_AUDIO_TYPES should contain exactly the expected set."""
        expected = {
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "audio/x-wav",
            "audio/wave",
            "audio/x-pn-wav",
            "audio/aiff",
            "audio/x-aiff",
            "audio/flac",
            "audio/ogg",
            "application/octet-stream",
        }
        assert ALLOWED_AUDIO_TYPES == expected
