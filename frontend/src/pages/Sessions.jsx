import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_BASE } from '../utils/api'
import './Sessions.css'

function fmt(seconds) {
  if (!seconds) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/sessions`)
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      setSessions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (filter !== 'All' && session.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (search && !session.original_filename.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  })

  return (
    <div className="sessions-page">
      <div className="sessions-page__inner">
        <div className="sessions-page__header slide-up">
          <div className="sessions-page__top">
            <div>
              <p className="section-overline">Library</p>
              <h1 className="section-title">Sessions</h1>
            </div>
            <Link to="/upload" className="btn btn--primary" id="new-session-btn">
              New Session
            </Link>
          </div>
          <p className="sessions-page__desc">
            All processed and in-progress audio sessions.
          </p>
        </div>

        {/* Search & filter bar */}
        <div className="sessions-toolbar glass slide-up" style={{ animationDelay: '80ms' }}>
          <div className="sessions-search">
            <svg className="sessions-search__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className="sessions-search__input"
              placeholder="Search sessions..."
              id="session-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="sessions-filters">
            {['All', 'Processed', 'Processing'].map(f => (
              <button 
                key={f}
                className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Session list */}
        <div className="sessions-list stagger">
          {loading && <p style={{ color: 'var(--text-muted)' }}>Loading sessions...</p>}
          {error && <p style={{ color: '#e57373' }}>Error: {error}</p>}
          {!loading && !error && filteredSessions.length === 0 && (
             <p style={{ color: 'var(--text-muted)' }}>No sessions found.</p>
          )}
          {filteredSessions.map(session => (
            <div key={session.audio_id} className="session-row glass">
              <div className="session-row__main">
                <div className="session-row__status-dot" data-status={session.status} />
                <div className="session-row__info">
                  <h3 className="session-row__name" title={session.audio_id}>
                    {session.original_filename}
                  </h3>
                  <div className="session-row__meta">
                    <span className="session-row__type">{session.source_type}</span>
                    <span className="session-row__sep" />
                    <span>{fmt(session.duration_seconds)}</span>
                    {session.chunk_count && (
                      <>
                        <span className="session-row__sep" />
                        <span>{session.chunk_count} chunks</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="session-row__actions">
                <span className={`status-badge status-badge--${session.status === 'processed' ? 'done' : (session.status === 'error' ? 'error' : 'processing')}`}>
                  {session.status}
                </span>
                <Link to={`/player/${session.audio_id}`} className="session-row__link">
                  Player
                </Link>
                <Link to={`/chunks/${session.audio_id}`} className="session-row__link">
                  Chunks
                </Link>
                <Link
                  to={`/transcript/${session.audio_id}`}
                  className="session-row__link"
                >
                  Transcript
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sessions
