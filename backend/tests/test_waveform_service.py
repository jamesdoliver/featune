"""Tests for the waveform generation service (error paths only)."""

import inspect
import os
import tempfile

import pytest

from app.services.waveform import generate_waveform


class TestGenerateWaveformFileNotFound:
    """generate_waveform should raise FileNotFoundError for missing paths."""

    def test_raises_file_not_found_for_nonexistent_path(self):
        """A path that does not exist should raise FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="Audio file not found"):
            generate_waveform("/tmp/absolutely_does_not_exist_waveform_99999.mp3")


class TestGenerateWaveformInvalidNumPoints:
    """generate_waveform should raise ValueError when num_points < 1.

    Note: The file-existence check runs first in the source, so we must
    provide a real (temporary) file to reach the num_points validation.
    """

    def test_raises_value_error_for_zero_num_points(self):
        """num_points=0 should raise ValueError."""
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            f.write(b"fake audio")
            tmp_path = f.name
        try:
            with pytest.raises(ValueError, match="num_points must be at least 1"):
                generate_waveform(tmp_path, num_points=0)
        finally:
            os.unlink(tmp_path)

    def test_raises_value_error_for_negative_num_points(self):
        """num_points=-5 should raise ValueError."""
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            f.write(b"fake audio")
            tmp_path = f.name
        try:
            with pytest.raises(ValueError, match="num_points must be at least 1"):
                generate_waveform(tmp_path, num_points=-5)
        finally:
            os.unlink(tmp_path)


class TestGenerateWaveformDefaults:
    """generate_waveform should have sensible default parameters."""

    def test_default_num_points_is_200(self):
        """The default value for num_points should be 200."""
        sig = inspect.signature(generate_waveform)
        default = sig.parameters["num_points"].default
        assert default == 200, f"Expected default num_points=200, got {default}"


class TestGenerateWaveformImportable:
    """generate_waveform should be importable from app.services.waveform."""

    def test_function_exists_and_is_callable(self):
        """The function should be importable and callable."""
        from app.services.waveform import generate_waveform as fn

        assert callable(fn), "generate_waveform should be callable"
