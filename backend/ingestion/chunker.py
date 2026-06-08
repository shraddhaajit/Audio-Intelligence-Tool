"""
Chunker — Module 3 & 4
Handles:
  - Semantic chunking of transcript segments (400-500 words, 100-word overlap)
  - Metadata attachment (timestamps, source, chunk_id)
Outputs: chunks.json in chunks/{audio_id}/

This is the integration contract file — Person 2 reads chunks.json directly.
"""

import json
import logging
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CHUNKS_DIR = PROJECT_ROOT / "chunks"

# Chunking parameters
TARGET_CHUNK_WORDS = 150  # Target ~150 words per chunk for better granularity on short audio
MAX_CHUNK_WORDS = 200
OVERLAP_WORDS = 30


def _format_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS or HH:MM:SS format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def _word_count(text: str) -> int:
    """Count words in a text string."""
    return len(text.split())


def chunk_transcript(
    segments: list,
    audio_id: str,
    source_filename: str,
    target_words: int = TARGET_CHUNK_WORDS,
    overlap_words: int = OVERLAP_WORDS,
) -> List[dict]:
    """
    Convert Whisper segments into overlapping chunks with metadata.
    
    Strategy:
    1. Accumulate segments until we reach target_words
    2. Save the chunk with start/end timestamps
    3. Roll back by overlap_words for the next chunk
    
    Args:
        segments: List of Whisper segments [{id, text, start, end}, ...]
        audio_id: Unique audio session ID
        source_filename: Original filename or title
        target_words: Target words per chunk (400-500)
        overlap_words: Number of overlap words between chunks
        
    Returns:
        List of chunk dicts matching the integration contract
    """
    if not segments:
        logger.warning("No segments to chunk")
        return []

    chunks = []
    chunk_id = 1
    
    # Build a flat list of (word, segment_index, segment_start, segment_end)
    word_entries = []
    for seg in segments:
        words = seg["text"].split()
        for w in words:
            word_entries.append({
                "word": w,
                "seg_start": seg["start"],
                "seg_end": seg["end"],
            })
    
    if not word_entries:
        return []
    
    total_words = len(word_entries)
    start_idx = 0
    
    while start_idx < total_words:
        # Determine end index for this chunk
        end_idx = min(start_idx + target_words, total_words)
        
        # Get the words for this chunk
        chunk_words = word_entries[start_idx:end_idx]
        
        if not chunk_words:
            break
        
        # Build chunk text
        text = " ".join(w["word"] for w in chunk_words)
        
        # Get timestamps from the underlying segments
        chunk_start_sec = chunk_words[0]["seg_start"]
        chunk_end_sec = chunk_words[-1]["seg_end"]
        
        chunk = {
            "chunk_id": chunk_id,
            "text": text,
            "start": _format_timestamp(chunk_start_sec),
            "end": _format_timestamp(chunk_end_sec),
            "start_seconds": round(chunk_start_sec, 2),
            "end_seconds": round(chunk_end_sec, 2),
            "word_count": len(chunk_words),
            "source": source_filename,
            "audio_id": audio_id,
        }
        
        chunks.append(chunk)
        chunk_id += 1
        
        # Move forward by (target - overlap) words
        step = max(target_words - overlap_words, 1)
        start_idx += step
        
        # If the remaining words are fewer than overlap, just stop
        if total_words - start_idx < overlap_words:
            # Add remaining as final chunk if there's meaningful content
            if start_idx < total_words:
                remaining = word_entries[start_idx:]
                remaining_text = " ".join(w["word"] for w in remaining)
                if _word_count(remaining_text) > 50:  # Only if substantial
                    chunk = {
                        "chunk_id": chunk_id,
                        "text": remaining_text,
                        "start": _format_timestamp(remaining[0]["seg_start"]),
                        "end": _format_timestamp(remaining[-1]["seg_end"]),
                        "start_seconds": round(remaining[0]["seg_start"], 2),
                        "end_seconds": round(remaining[-1]["seg_end"], 2),
                        "word_count": len(remaining),
                        "source": source_filename,
                        "audio_id": audio_id,
                    }
                    chunks.append(chunk)
            break
    
    logger.info(f"Created {len(chunks)} chunks from {total_words} words")
    return chunks


def save_chunks(chunks: list, audio_id: str) -> str:
    """
    Save chunks to chunks/{audio_id}_chunks.json
    This is the file Person 2 reads.
    
    Args:
        chunks: List of chunk dicts
        audio_id: Audio session ID
        
    Returns:
        Path to the saved chunks file
    """
    chunk_dir = CHUNKS_DIR / audio_id
    chunk_dir.mkdir(parents=True, exist_ok=True)
    chunks_path = chunk_dir / "chunks.json"
    
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Chunks saved: {chunks_path} ({len(chunks)} chunks)")
    return str(chunks_path)


def process_and_save(
    segments: list,
    audio_id: str,
    source_filename: str,
) -> dict:
    """
    Full chunking pipeline: chunk + save.
    
    Returns:
        dict with audio_id, chunks_path, chunk_count, chunks
    """
    chunks = chunk_transcript(segments, audio_id, source_filename)
    chunks_path = save_chunks(chunks, audio_id)
    
    return {
        "audio_id": audio_id,
        "chunks_path": chunks_path,
        "chunk_count": len(chunks),
        "chunks": chunks,
    }
