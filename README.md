# Audio Intelligence System

An offline-first, AI-powered library for your audio and video content. 

This project allows you to upload local audio files or simply paste a YouTube/Podcast link. The system automatically downloads the audio, transcribes it, and breaks it down into bite-sized semantic chunks. You can then use the built-in AI interface to ask questions across your entire library and get exact answers backed by direct quotes and timestamps from your media.

## How It Works

1. **Ingestion**: You upload an MP3/WAV or provide a YouTube/Spotify link. `yt-dlp` safely downloads it.
2. **Transcription**: The system uses `faster-whisper` (running locally on your CPU) to generate an incredibly accurate, timestamped transcript of the entire audio.
3. **Semantic Chunking**: The transcript is sliced into overlapping 150-word chunks so context is never lost.
4. **Vector Storage**: The chunks are mapped and saved into a local `ChromaDB` database.
5. **AI Retrieval**: When you ask a question, the backend mathematically searches for the most relevant chunks in your database.
6. **Smart Generation**: The relevant evidence is passed to a local AI model (`Ollama` running `qwen2.5:3b`). The AI reads your actual evidence, figures out the answer, and presents it to you alongside the original quotes and timestamps.

## Getting Started

### Prerequisites
1. Install Python 3.10+
2. Install Node.js (for the frontend)
3. Install **FFmpeg** (required for Whisper and yt-dlp to process audio)
   - Windows: `winget install ffmpeg`
   - Mac: `brew install ffmpeg`
4. Install **Ollama** and pull the required AI model:
   ```bash
   ollama pull qwen2.5:3b
   ```

### 1. Start the Backend (API & AI)
Open a terminal in the root folder and install the Python dependencies:
```bash
pip install -r requirements.txt
python -m uvicorn backend.api.main:app --reload --port 8000
```

### 2. Start the Frontend (User Interface)
Open a *second* terminal, navigate to the frontend folder, and start the React app:
```bash
cd frontend
npm install
npm run dev
```

Click the `localhost:5173` link in your terminal to open the UI. You are ready to start building your intelligence library!

## Project Structure
- `/backend`: The FastAPI server, `faster-whisper` transcription, database management, and upload handling.
- `/ai`: The intelligence layer. Contains ChromaDB retrieval, BM25 searching, and the Ollama generation prompts.
- `/frontend`: The React UI where you can view sessions, read transcripts, and chat with the AI.
- `/uploads`, `/transcripts`, `/chunks`, `/vectordb`: Auto-generated folders where your local data is safely stored.
