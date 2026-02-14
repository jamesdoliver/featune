"""Tests for the audio watermark service (error paths and validation only)."""

import tempfile
import os
from unittest.mock import patch

import pytest

from app.services.watermark import (
    _load_audio,
    _load_voice_tag,
    DEFAULT_VOICE_TAG_PATH,
    VOICE_TAG_PATH,
)


class TestLoadAudioFileNotFound:
    """_load_audio should raise FileNotFoundError for non-existent paths."""

    def test_raises_file_not_found_for_missing_path(self):
        """A path that does not exist should raise FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="Audio file not found"):
            _load_audio("/tmp/absolutely_does_not_exist_12345.mp3")


class TestLoadAudioUnsupportedFormat:
    """_load_audio should raise ValueError for unsupported file extensions."""

    def test_raises_value_error_for_txt_extension(self):
        """A .txt file should be rejected as unsupported format."""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"not audio")
            tmp_path = f.name
        try:
            with pytest.raises(ValueError, match="Unsupported audio format '.txt'"):
                _load_audio(tmp_path)
        finally:
            os.unlink(tmp_path)

    def test_raises_value_error_for_py_extension(self):
        """A .py file should be rejected as unsupported format."""
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
            f.write(b"print('hello')")
            tmp_path = f.name
        try:
            with pytest.raises(ValueError, match="Unsupported audio format '.py'"):
                _load_audio(tmp_path)
        finally:
            os.unlink(tmp_path)

    def test_error_message_lists_supported_formats(self):
        """The ValueError message should list all supported formats."""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"not audio")
            tmp_path = f.name
        try:
            with pytest.raises(ValueError) as exc_info:
                _load_audio(tmp_path)
            message = str(exc_info.value)
            for fmt in ("aac", "flac", "m4a", "mp3", "ogg", "wav"):
                assert fmt in message, f"Expected '{fmt}' in error message"
        finally:
            os.unlink(tmp_path)


class TestLoadAudioSupportedFormatsSet:
    """_load_audio should recognise all six expected audio formats."""

    @pytest.mark.parametrize("ext", ["mp3", "wav", "ogg", "flac", "m4a", "aac"])
    def test_supported_extension_passes_format_check(self, ext: str):
        """Files with supported extensions should pass the format validation
        (they will fail later at AudioSegment.from_file because the content
        is not real audio, but they must NOT raise ValueError)."""
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as f:
            f.write(b"fake audio content")
            tmp_path = f.name
        try:
            # Should NOT raise ValueError — it should get past the extension
            # check and fail on AudioSegment.from_file instead.
            with pytest.raises(Exception) as exc_info:
                _load_audio(tmp_path)
            # The error must NOT be a ValueError (that would mean the format
            # was rejected). It should be some pydub/ffmpeg decoding error.
            assert not isinstance(exc_info.value, ValueError), (
                f"Extension '.{ext}' should be supported but was rejected"
            )
        finally:
            os.unlink(tmp_path)


class TestLoadVoiceTagFileNotFound:
    """_load_voice_tag should raise FileNotFoundError for missing paths."""

    def test_raises_file_not_found_for_missing_tag(self):
        """A non-existent voice tag path should raise FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="Voice tag file not found"):
            _load_voice_tag("/tmp/absolutely_does_not_exist_voice_tag_99999.mp3")

    def test_error_message_includes_placement_instructions(self):
        """The FileNotFoundError message should tell the user where to place
        the voice tag file or how to set the environment variable."""
        with pytest.raises(FileNotFoundError) as exc_info:
            _load_voice_tag("/tmp/missing_voice_tag.mp3")
        message = str(exc_info.value)
        assert "backend/assets/" in message
        assert "VOICE_TAG_PATH" in message

    def test_uses_voice_tag_path_when_no_argument_given(self):
        """When called with no argument, _load_voice_tag should fall back to
        VOICE_TAG_PATH. We patch os.path.isfile to return False so the
        function raises FileNotFoundError containing the default path,
        proving it used VOICE_TAG_PATH rather than some other value."""
        with patch("app.services.watermark.os.path.isfile", return_value=False):
            with pytest.raises(FileNotFoundError) as exc_info:
                _load_voice_tag()
            message = str(exc_info.value)
            # The error should reference the VOICE_TAG_PATH (i.e. the default path)
            assert VOICE_TAG_PATH in message


class TestDefaultVoiceTagPath:
    """Verify the DEFAULT_VOICE_TAG_PATH constant points to the expected location."""

    def test_default_path_ends_with_expected_suffix(self):
        """DEFAULT_VOICE_TAG_PATH should point to backend/assets/voice_tag.mp3."""
        # Normalise separators for cross-platform safety
        normalised = DEFAULT_VOICE_TAG_PATH.replace("\\", "/")
        assert normalised.endswith("backend/assets/voice_tag.mp3"), (
            f"Expected DEFAULT_VOICE_TAG_PATH to end with "
            f"'backend/assets/voice_tag.mp3', got: {DEFAULT_VOICE_TAG_PATH}"
        )
