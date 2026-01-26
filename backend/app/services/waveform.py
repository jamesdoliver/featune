"""Waveform generation service.

Uses librosa to load audio and extract an amplitude envelope, returning a
JSON-serializable list of floats normalised to the 0.0-1.0 range.
"""

import os

import librosa
import numpy as np


def generate_waveform(audio_path: str, num_points: int = 200) -> list[float]:
    """Generate a downsampled amplitude envelope from an audio file.

    Args:
        audio_path: Path to the audio file (any format supported by librosa /
            soundfile / ffmpeg).
        num_points: Number of data points in the returned envelope. The raw
            amplitude data is downsampled to this length. Defaults to 200.

    Returns:
        A list of *num_points* floats in the range [0.0, 1.0] representing the
        amplitude envelope of the audio.

    Raises:
        FileNotFoundError: If *audio_path* does not exist.
        ValueError: If *num_points* is less than 1.
    """
    if not os.path.isfile(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    if num_points < 1:
        raise ValueError("num_points must be at least 1")

    # Load audio as mono, at the native sample rate
    y, _sr = librosa.load(audio_path, sr=None, mono=True)

    # Take absolute values to get the amplitude envelope
    amplitude = np.abs(y)

    # Downsample to the requested number of points by splitting into equal
    # chunks and taking the mean of each chunk.
    if len(amplitude) == 0:
        return [0.0] * num_points

    # Trim or pad so we can split evenly
    chunk_size = max(1, len(amplitude) // num_points)
    trimmed_length = chunk_size * num_points
    amplitude = amplitude[:trimmed_length]

    chunks = np.array_split(amplitude, num_points)
    downsampled = np.array([chunk.mean() for chunk in chunks])

    # Normalise to 0.0 - 1.0
    max_val = downsampled.max()
    if max_val > 0:
        normalised = downsampled / max_val
    else:
        normalised = downsampled

    # Convert to plain Python floats for JSON serialisation
    return [round(float(v), 4) for v in normalised]
