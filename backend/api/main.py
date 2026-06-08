"""
FastAPI Backend — Module 5
Endpoints:
  POST /upload     — Upload audio file or provide URL
  GET  /status     — Get processing status for an audio_id
  GET  /sessions   — List all sessions
  GET  /transcript/{audio_id} — Get transcript
  GET  /chunks/{audio_id}     — Get chunks (for Person 2)
"""

import os
import json
import shutil
import logging
import tempfile
import asyncio
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Import our modules
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.ingestion.audio_extractor import process_upload, detect_and_process
from backend.ingestion.transcriber import transcribe
from backend.ingestion.chunker import process_and_save
from backend.database.db import (
    create_session, update_session, get_session, get_all_sessions, init_db
)

# Insert the ai module into the path
sys.path.insert(0, str(PROJECT_ROOT / "ai"))
from retrieval.retrieve import retrieve
from generation.generator import generate_answer
from verification.verify import verify
from pydantic import BaseModel

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
UPLOADS_DIR = PROJECT_ROOT / "uploads"
TRANSCRIPTS_DIR = PROJECT_ROOT / "transcripts"
CHUNKS_DIR = PROJECT_ROOT / "chunks"

# Create directories at import time (required before StaticFiles mount)
UPLOADS_DIR.mkdir(exist_ok=True)
TRANSCRIPTS_DIR.mkdir(exist_ok=True)
CHUNKS_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    init_db()
    logger.info("Audio Intelligence API started")
    yield
    logger.info("Audio Intelligence API shutting down")


app = FastAPI(
    title="Audio Intelligence API",
    description="Person 1 — Audio ingestion, transcription, and chunking",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for Streamlit
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded audio files for the player
app.mount("/audio-files", StaticFiles(directory=str(UPLOADS_DIR)), name="audio-files")


def process_audio(audio_id: str, wav_path: str, source_filename: str):
    """
    Run the full ingestion pipeline synchronously.
    Called in a background thread.
    """
    try:
        # Step 1: Update status to transcribing
        update_session(audio_id, status="transcribing")
        logger.info(f"[{audio_id}] Starting transcription...")

        # Step 2: Transcribe
        transcript_result = transcribe(wav_path, audio_id)
        update_session(
            audio_id,
            status="chunking",
            transcript_path=transcript_result["transcript_path"],
            duration_seconds=transcript_result["duration_seconds"],
            segment_count=transcript_result["segment_count"],
        )
        logger.info(f"[{audio_id}] Transcription done: {transcript_result['segment_count']} segments")

        # Step 3: Chunk
        chunk_result = process_and_save(
            segments=transcript_result["segments"],
            audio_id=audio_id,
            source_filename=source_filename,
        )
        
        # Trigger AI Index Rebuild
        try:
            from ai.retrieval.chroma_store import build_chroma_index
            from ai.retrieval.bm25_store import build_bm25_index
            build_chroma_index()
            build_bm25_index()
            logger.info(f"[{audio_id}] AI indexes rebuilt successfully")
        except Exception as e:
            logger.error(f"[{audio_id}] Failed to rebuild AI indexes: {e}")

        update_session(
            audio_id,
            status="processed",
            chunks_path=chunk_result["chunks_path"],
            chunk_count=chunk_result["chunk_count"],
        )
        logger.info(f"[{audio_id}] Pipeline complete: {chunk_result['chunk_count']} chunks")

    except Exception as e:
        logger.error(f"[{audio_id}] Pipeline failed: {e}")
        update_session(audio_id, status="error", error_message=str(e))


@app.post("/upload")
async def upload_audio(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
):
    """
    Upload an audio file or provide a URL.
    Starts the ingestion pipeline in the background.
    
    Returns: {audio_id, status}
    """
    if file is None and url is None:
        raise HTTPException(status_code=400, detail="Provide either a file or a URL")

    try:
        if file:
            # Handle file upload
            tmp_dir = UPLOADS_DIR / "_tmp"
            tmp_dir.mkdir(exist_ok=True)
            tmp_path = tmp_dir / file.filename
            
            with open(tmp_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            result = process_upload(str(tmp_path), file.filename)
            
            # Clean up temp
            if tmp_path.exists():
                tmp_path.unlink()
                
        elif url:
            # Handle URL
            result = detect_and_process(url)

        # Create DB session
        create_session(
            audio_id=result["audio_id"],
            original_filename=result["original_filename"],
            source_type=result["source_type"],
            wav_path=result["wav_path"],
            source_url=result.get("source_url"),
        )

        # Run pipeline in background
        audio_id = result["audio_id"]
        wav_path = result["wav_path"]
        source_filename = result["original_filename"]
        
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, process_audio, audio_id, wav_path, source_filename)

        return {
            "status": "ready",
            "audio_id": audio_id
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status")
def get_status(audio_id: str):
    """Get processing status for an audio session."""
    session = get_session(audio_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/sessions")
def list_sessions():
    """List all audio sessions."""
    return get_all_sessions()


@app.get("/transcript/{audio_id}")
def get_transcript(audio_id: str):
    """Get the full transcript for an audio session."""
    session = get_session(audio_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] not in ("processed", "chunking"):
        return {"audio_id": audio_id, "status": session["status"], "transcript": None}
    
    transcript_path = session.get("transcript_path")
    if not transcript_path or not Path(transcript_path).exists():
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    with open(transcript_path, "r", encoding="utf-8") as f:
        transcript = json.load(f)
    
    return transcript


@app.get("/chunks/{audio_id}")
def get_chunks(audio_id: str):
    """
    Get chunks for an audio session.
    This is the endpoint Person 2's retrieval layer calls.
    """
    session = get_session(audio_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] != "processed":
        return {"audio_id": audio_id, "status": session["status"], "chunks": None}
    
    chunks_path = session.get("chunks_path")
    if not chunks_path or not Path(chunks_path).exists():
        raise HTTPException(status_code=404, detail="Chunks not found")
    
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)
    
    return {"audio_id": audio_id, "chunk_count": len(chunks), "chunks": chunks}


class QuestionRequest(BaseModel):
    question: str

@app.post("/query")
def query_audio(request: QuestionRequest):
    question = request.question
    results = retrieve(question)

    if not results or not results["documents"] or not results["documents"][0]:
        return {"error": "No matching evidence found"}

    docs = results["documents"][0]
    metadata = results["metadatas"][0]
    distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)

    evidence_text = ""
    evidence_list = []

    for doc, meta in zip(docs, metadata):
        evidence_text += doc + "\n\n"
        evidence_list.append({
            "text": doc,
            "timestamp": meta["start"],
            "end_timestamp": meta.get("end", meta["start"]),
            "source": meta.get("source", "Unknown"),
            "audio_id": meta.get("audio_id", "")
        })

    answer = generate_answer(question, evidence_text)
    
    # Check if verify takes distances as an argument
    try:
        support, confidence = verify(distances, len(evidence_list))
    except TypeError:
        # If verify only takes len(evidence_list)
        support, confidence = verify(len(evidence_list))

    return {
        "question": question,
        "answer": answer,
        "support": support,
        "confidence": confidence,
        "evidence": evidence_list
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "audio-intelligence-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
