# Audio Intelligence & Evidence Retrieval System

## Person 1 — Audio Intelligence Engineer

Converts raw audio into structured, searchable knowledge chunks.

### Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Install ffmpeg (required by Whisper + yt-dlp)
# Windows: winget install ffmpeg
# Mac: brew install ffmpeg

# 3. Start the API backend
python -m uvicorn backend.api.main:app --reload --port 8000

# 4. Start the Streamlit frontend (new terminal)
streamlit run frontend/app.py --server.port 8501
```

### Pipeline

```
Audio / YouTube URL
    → Audio Extraction (yt-dlp + ffmpeg)
    → Whisper Transcription (timestamped segments)
    → Semantic Chunking (400-500 words, 100-word overlap)
    → chunks.json (Person 2's input)
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload file or URL |
| GET | `/status/{audio_id}` | Processing status |
| GET | `/sessions` | All sessions |
| GET | `/transcript/{audio_id}` | Transcript data |
| GET | `/chunks/{audio_id}` | Chunks for retrieval |

### Integration Contract

Person 2 reads `chunks/{audio_id}_chunks.json`:

```json
[
  {
    "chunk_id": 1,
    "text": "...",
    "start": "02:10",
    "end": "02:45",
    "start_seconds": 130,
    "end_seconds": 165,
    "source": "lecture.mp3",
    "audio_id": "abc123"
  }
]
```
