"""
Database — SQLite operations
Tracks:
  - Audio sessions (upload metadata, processing status)
  - Links audio_id to transcript/chunks paths
"""

import sqlite3
import json
import logging
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = PROJECT_ROOT / "database" / "audio_intelligence.db"


def _get_connection() -> sqlite3.Connection:
    """Get a SQLite connection with row factory."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database schema."""
    conn = _get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audio_sessions (
            audio_id TEXT PRIMARY KEY,
            original_filename TEXT NOT NULL,
            source_type TEXT NOT NULL DEFAULT 'upload',
            source_url TEXT,
            wav_path TEXT,
            transcript_path TEXT,
            chunks_path TEXT,
            status TEXT NOT NULL DEFAULT 'uploaded',
            duration_seconds REAL,
            segment_count INTEGER,
            chunk_count INTEGER,
            error_message TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info("Database initialized")


def create_session(audio_id: str, original_filename: str, source_type: str,
                   wav_path: str, source_url: str = None) -> dict:
    """Create a new audio processing session."""
    conn = _get_connection()
    now = datetime.utcnow().isoformat()
    
    conn.execute("""
        INSERT INTO audio_sessions 
        (audio_id, original_filename, source_type, source_url, wav_path, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'uploaded', ?, ?)
    """, (audio_id, original_filename, source_type, source_url, wav_path, now, now))
    
    conn.commit()
    conn.close()
    logger.info(f"Session created: {audio_id}")
    
    return {"audio_id": audio_id, "status": "uploaded"}


def update_session(audio_id: str, **kwargs) -> dict:
    """Update fields on an audio session."""
    conn = _get_connection()
    now = datetime.utcnow().isoformat()
    
    kwargs["updated_at"] = now
    
    set_clause = ", ".join(f"{k} = ?" for k in kwargs.keys())
    values = list(kwargs.values()) + [audio_id]
    
    conn.execute(f"""
        UPDATE audio_sessions SET {set_clause} WHERE audio_id = ?
    """, values)
    
    conn.commit()
    conn.close()
    return {"audio_id": audio_id, "updated": list(kwargs.keys())}


def get_session(audio_id: str) -> dict:
    """Get a session by audio_id."""
    conn = _get_connection()
    row = conn.execute(
        "SELECT * FROM audio_sessions WHERE audio_id = ?", (audio_id,)
    ).fetchone()
    conn.close()
    
    if row is None:
        return None
    return dict(row)


def get_all_sessions() -> list:
    """Get all sessions, most recent first."""
    conn = _get_connection()
    rows = conn.execute(
        "SELECT * FROM audio_sessions ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_session(audio_id: str) -> bool:
    """Delete a session."""
    conn = _get_connection()
    result = conn.execute(
        "DELETE FROM audio_sessions WHERE audio_id = ?", (audio_id,)
    )
    conn.commit()
    conn.close()
    return result.rowcount > 0


# Initialize on import
init_db()
