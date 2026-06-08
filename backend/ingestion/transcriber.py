"""
Whisper Transcriber — Module 2
Handles:
  - Loading Whisper Small model
  - Transcribing .wav files
  - Producing timestamped segments
Outputs: transcript.json in transcripts/{audio_id}/
"""

import json
import logging
import time
from pathlib import Path

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
TRANSCRIPTS_DIR = PROJECT_ROOT / "transcripts"

# Lazy-loaded model (loaded once, reused)
_whisper_model = None


def _load_model(model_name: str = "small"):
    """Load the Whisper model (lazy singleton)."""
    global _whisper_model
    if _whisper_model is None:
        import whisper
        logger.info(f"Loading Whisper '{model_name}' model...")
        start = time.time()
        _whisper_model = whisper.load_model(model_name)
        elapsed = time.time() - start
        logger.info(f"Whisper model loaded in {elapsed:.1f}s")
    return _whisper_model


def transcribe(wav_path: str, audio_id: str, model_name: str = "medium") -> dict:
    """
    Transcribe a WAV file using Whisper.
    
    Args:
        wav_path: Path to the 16kHz mono WAV file
        audio_id: Unique identifier for this audio session
        model_name: Whisper model size (tiny, base, small, medium, large)
        
    Returns:
        dict with audio_id, transcript_path, segments, full_text, duration
    """
    import whisper

    model = _load_model(model_name)
    
    logger.info(f"Transcribing: {wav_path}")
    start = time.time()
    
    # Transcribe with word timestamps for better segmentation
    result = model.transcribe(
        wav_path,
        language="en",
        verbose=False,
        fp16=False,  # Use FP32 for CPU compatibility on 8GB RAM
    )
    
    elapsed = time.time() - start
    logger.info(f"Transcription completed in {elapsed:.1f}s")

    # Extract segments with timestamps
    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "id": seg["id"],
            "text": seg["text"].strip(),
            "start": round(seg["start"], 2),
            "end": round(seg["end"], 2),
        })

    # Calculate total duration
    duration = segments[-1]["end"] if segments else 0.0

    # Build transcript output
    transcript_data = {
        "audio_id": audio_id,
        "full_text": result["text"].strip(),
        "language": result.get("language", "en"),
        "duration_seconds": duration,
        "segment_count": len(segments),
        "segments": segments,
    }

    # Save to disk
    transcript_dir = TRANSCRIPTS_DIR / audio_id
    transcript_dir.mkdir(parents=True, exist_ok=True)
    transcript_path = transcript_dir / "transcript.json"
    
    with open(transcript_path, "w", encoding="utf-8") as f:
        json.dump(segments, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Transcript saved: {transcript_path} ({len(segments)} segments)")

    return {
        "audio_id": audio_id,
        "transcript_path": str(transcript_path),
        "segments": segments,
        "full_text": result["text"].strip(),
        "duration_seconds": duration,
        "segment_count": len(segments),
    }


def format_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS or HH:MM:SS format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
