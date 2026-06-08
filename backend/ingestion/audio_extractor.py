"""
Audio Extractor — Module 1
Handles:
  - MP3/WAV file uploads (copy to uploads/)
  - YouTube URL download via yt-dlp
  - Spotify / Apple Podcast URL download via yt-dlp
Outputs: .wav file in uploads/{audio_id}/
"""

import os
import uuid
import shutil
import subprocess
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Base directories (relative to project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
UPLOADS_DIR = PROJECT_ROOT / "uploads"

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm"}


def _ensure_dirs(audio_id: str) -> Path:
    """Create the upload directory for a specific audio session."""
    audio_dir = UPLOADS_DIR / audio_id
    audio_dir.mkdir(parents=True, exist_ok=True)
    return audio_dir


def _convert_to_wav(input_path: Path, output_path: Path) -> Path:
    """Convert any audio file to 16kHz mono WAV (Whisper's preferred format)."""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        str(output_path),
    ]
    logger.info(f"Converting to WAV: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {result.stderr}")
    return output_path


def process_upload(file_path: str, original_filename: str) -> dict:
    """
    Process an uploaded audio file.
    
    Args:
        file_path: Path to the temporary uploaded file
        original_filename: Original filename from the upload
        
    Returns:
        dict with audio_id, wav_path, original_filename, source_type
    """
    audio_id = uuid.uuid4().hex[:12]
    audio_dir = _ensure_dirs(audio_id)

    ext = Path(original_filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file format: {ext}. Supported: {SUPPORTED_EXTENSIONS}")

    # Copy uploaded file to our storage
    stored_path = audio_dir / original_filename
    shutil.copy2(file_path, stored_path)
    logger.info(f"Stored upload: {stored_path}")

    # Convert to WAV for Whisper
    wav_path = audio_dir / "audio.wav"
    if ext == ".wav":
        # Still convert to ensure 16kHz mono
        _convert_to_wav(stored_path, wav_path)
    else:
        _convert_to_wav(stored_path, wav_path)

    return {
        "audio_id": audio_id,
        "wav_path": str(wav_path),
        "original_filename": original_filename,
        "source_type": "upload",
    }


def process_youtube_url(url: str) -> dict:
    """
    Download audio from a YouTube URL using yt-dlp.
    
    Args:
        url: YouTube video URL
        
    Returns:
        dict with audio_id, wav_path, original_filename, source_type
    """
    audio_id = uuid.uuid4().hex[:12]
    audio_dir = _ensure_dirs(audio_id)

    output_template = str(audio_dir / "downloaded.%(ext)s")

    cmd = [
        "yt-dlp",
        "--extract-audio",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "--output", output_template,
        "--no-playlist",
        url,
    ]
    logger.info(f"Downloading from YouTube: {url}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp download failed: {result.stderr}")

    # Find the downloaded file
    downloaded_files = list(audio_dir.glob("downloaded.*"))
    if not downloaded_files:
        raise RuntimeError("yt-dlp did not produce any output file")

    downloaded = downloaded_files[0]

    # Convert to consistent WAV format
    wav_path = audio_dir / "audio.wav"
    if downloaded.suffix == ".wav" and downloaded.name != "audio.wav":
        _convert_to_wav(downloaded, wav_path)
    elif downloaded.suffix != ".wav":
        _convert_to_wav(downloaded, wav_path)
    else:
        wav_path = downloaded

    # Try to get the video title
    title_cmd = ["yt-dlp", "--get-title", "--no-playlist", url]
    title_result = subprocess.run(title_cmd, capture_output=True, text=True)
    title = title_result.stdout.strip() if title_result.returncode == 0 else url

    return {
        "audio_id": audio_id,
        "wav_path": str(wav_path),
        "original_filename": title,
        "source_type": "youtube",
        "source_url": url,
    }


def process_podcast_url(url: str) -> dict:
    """
    Download audio from a Spotify/Apple Podcast URL using yt-dlp.
    yt-dlp supports many podcast platforms.
    
    Args:
        url: Podcast episode URL
        
    Returns:
        dict with audio_id, wav_path, original_filename, source_type
    """
    audio_id = uuid.uuid4().hex[:12]
    audio_dir = _ensure_dirs(audio_id)

    output_template = str(audio_dir / "downloaded.%(ext)s")

    cmd = [
        "yt-dlp",
        "--extract-audio",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "--output", output_template,
        "--no-playlist",
        url,
    ]
    logger.info(f"Downloading podcast: {url}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp podcast download failed: {result.stderr}")

    downloaded_files = list(audio_dir.glob("downloaded.*"))
    if not downloaded_files:
        raise RuntimeError("yt-dlp did not produce any output file")

    downloaded = downloaded_files[0]
    wav_path = audio_dir / "audio.wav"
    _convert_to_wav(downloaded, wav_path)

    # Detect source type
    source_type = "podcast"
    if "spotify" in url.lower():
        source_type = "spotify"
    elif "apple" in url.lower():
        source_type = "apple_podcast"

    return {
        "audio_id": audio_id,
        "wav_path": str(wav_path),
        "original_filename": url,
        "source_type": source_type,
        "source_url": url,
    }


def detect_and_process(input_value: str, file_path: str = None) -> dict:
    """
    Auto-detect input type and route to the correct processor.
    
    Args:
        input_value: Either a URL string or original filename
        file_path: Path to uploaded file (only for file uploads)
        
    Returns:
        Processing result dict
    """
    # Check if it's a URL
    if input_value.startswith(("http://", "https://")):
        url_lower = input_value.lower()
        if "youtube.com" in url_lower or "youtu.be" in url_lower:
            return process_youtube_url(input_value)
        elif "spotify.com" in url_lower or "apple.com" in url_lower:
            return process_podcast_url(input_value)
        else:
            # Try yt-dlp anyway — it supports many sites
            return process_youtube_url(input_value)
    elif file_path:
        return process_upload(file_path, input_value)
    else:
        raise ValueError("Provide either a URL or a file upload.")
