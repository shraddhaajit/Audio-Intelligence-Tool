import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { API_BASE } from '../utils/api'
import './Player.css'

function fmt(seconds) {
  if (isNaN(seconds) || seconds === null) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function Player() {
  const { audioId } = useParams()
  const [isPlaying, setIsPlaying] = useState(false)
  const [session, setSession] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [loading, setLoading] = useState(!!audioId)
  const [error, setError] = useState(null)
  
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioId) {
      fetchSessionAndTranscript()
    }
  }, [audioId])

  const fetchSessionAndTranscript = async () => {
    try {
      setLoading(true)
      const resSession = await fetch(`${API_BASE}/status?audio_id=${audioId}`)
      if (!resSession.ok) throw new Error('Failed to fetch session status')
      const sessionData = await resSession.json()
      setSession(sessionData)

      if (sessionData.status === 'processed' || sessionData.status === 'chunking') {
        const resTranscript = await fetch(`${API_BASE}/transcript/${audioId}`)
        if (resTranscript.ok) {
           const transcriptData = await resTranscript.json()
           setTranscript(transcriptData)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }

  const skip = (amount) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  }

  const changeSpeed = (newSpeed) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
      setSpeed(newSpeed);
    }
  }

  if (!audioId) {
    return (
      <div className="player-page">
         <div className="player-page__inner" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <p className="section-overline">Playback</p>
            <h1 className="section-title">No Session Selected</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '2rem' }}>
              Please select a session from the library to play audio.
            </p>
            <Link to="/sessions" className="btn btn--primary">Go to Sessions</Link>
         </div>
      </div>
    )
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const segmentsList = Array.isArray(transcript) ? transcript : (transcript?.segments || [])
  const activeSegmentIndex = segmentsList.findIndex(seg => currentTime >= seg.start && currentTime <= seg.end)

  return (
    <div className="player-page">
      <div className="player-page__inner">
        <div className="player-page__header slide-up">
          <p className="section-overline">Playback</p>
          <h1 className="section-title">
            Session {audioId.substring(0, 8)}
          </h1>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading player...</p>}
        {error && <p style={{ color: '#e57373' }}>Error: {error}</p>}

        {session && (
          <div className="player-card glass slide-up" style={{ animationDelay: '120ms' }}>
            <div className="player-card__info">
              <h2 className="player-card__title">{session.original_filename}</h2>
              <p className="player-card__meta">
                {session.source_type} / {fmt(session.duration_seconds || duration)} / {session.status}
              </p>
            </div>

            <audio 
              ref={audioRef}
              src={`${API_BASE}/audio-files/${audioId}/audio.wav`}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Waveform display */}
            <div className="player-waveform">
              <div className="player-waveform__bars">
                {Array.from({ length: 80 }, (_, i) => (
                  <div
                    key={i}
                    className="player-waveform__bar"
                    style={{
                      '--h': `${15 + Math.sin(i * 0.3) * 25 + Math.random() * 30}%`,
                    }}
                  />
                ))}
              </div>
              <div className="player-waveform__progress" style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Time */}
            <div className="player-time">
              <span className="player-time__current">{fmt(currentTime)}</span>
              <span className="player-time__total">{fmt(duration || session.duration_seconds)}</span>
            </div>

            {/* Controls */}
            <div className="player-controls">
              <button className="player-btn player-btn--sm" onClick={() => skip(-15)} aria-label="Rewind 15 seconds">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
                  <text x="9" y="16" fontSize="7" fill="currentColor" fontFamily="sans-serif" fontWeight="700">15</text>
                </svg>
              </button>

              <button
                className="player-btn player-btn--play"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1"/>
                    <rect x="14" y="5" width="4" height="14" rx="1"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z"/>
                  </svg>
                )}
              </button>

              <button className="player-btn player-btn--sm" onClick={() => skip(15)} aria-label="Forward 15 seconds">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="currentColor"/>
                  <text x="9" y="16" fontSize="7" fill="currentColor" fontFamily="sans-serif" fontWeight="700">15</text>
                </svg>
              </button>
            </div>

            {/* Speed control */}
            <div className="player-speed">
              {[0.5, 1, 1.5, 2].map(sp => (
                <button
                  key={sp}
                  className={`speed-chip ${speed === sp ? 'speed-chip--active' : ''}`}
                  onClick={() => changeSpeed(sp)}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Linked segments */}
        {segmentsList && segmentsList.length > 0 && (
          <div className="player-segments slide-up" style={{ animationDelay: '240ms' }}>
            <h3 className="player-segments__title">Synchronized Segments</h3>
            <p className="player-segments__desc">
              Segments will highlight as audio plays, allowing you to follow along with the transcript in real time.
            </p>
            <div className="player-segment-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {segmentsList.map((seg, i) => (
                <div 
                   key={i} 
                   className={`player-segment ${i === activeSegmentIndex ? 'player-segment--active' : ''}`}
                   onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = seg.start;
                        if (!isPlaying) togglePlay();
                      }
                   }}
                   style={{ cursor: 'pointer' }}
                >
                  <span className="player-segment__time">{fmt(seg.start)}</span>
                  <p className="player-segment__text">{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Player
