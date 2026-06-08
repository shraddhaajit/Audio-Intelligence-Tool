import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_BASE } from '../utils/api'
import './Transcript.css'

function fmt(seconds) {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Transcript() {
  const { audioId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!!audioId)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (audioId) {
      fetchTranscript()
    }
  }, [audioId])

  const fetchTranscript = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/transcript/${audioId}`)
      if (!res.ok) throw new Error('Failed to fetch transcript')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!audioId) {
    return (
      <div className="transcript-page">
         <div className="transcript-page__inner" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <p className="section-overline">Transcript</p>
            <h1 className="section-title">No Session Selected</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '2rem' }}>
              Please select a session from the library to view its transcript.
            </p>
            <Link to="/sessions" className="btn btn--primary">Go to Sessions</Link>
         </div>
      </div>
    )
  }

  const segments = Array.isArray(data) ? data : (data?.segments || [])
  const isProcessed = Array.isArray(data) || (data && (data.status === 'processed' || data.status === 'chunking'))

  return (
    <div className="transcript-page">
      <div className="transcript-page__inner">
        <div className="transcript-page__header slide-up">
          <p className="section-overline">Transcript</p>
          <h1 className="section-title">
            Session {audioId.substring(0, 8)}
          </h1>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading transcript...</p>}
        {error && <p style={{ color: '#e57373' }}>Error: {error}</p>}
        
        {data && !Array.isArray(data) && data.status && data.status !== 'processed' && data.status !== 'chunking' && (
           <div className="metric-card glass" style={{ textAlign: 'left' }}>
             <p>Status: <strong>{data.status}</strong></p>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transcript is not ready yet.</p>
           </div>
        )}

        {isProcessed && (
          <>
            {/* Metrics row */}
            <div className="transcript-metrics stagger">
              {[
                { value: Array.isArray(data) ? (data.length > 0 ? fmt(data[data.length-1].end) : '00:00') : fmt(data.duration_seconds), label: 'Duration' },
                { value: Array.isArray(data) ? data.length : (data.segment_count || 0), label: 'Segments' },
                { value: Array.isArray(data) ? 'EN' : (data.language || 'EN').toUpperCase(), label: 'Language' },
              ].map((m, i) => (
                <div key={i} className="metric-card glass">
                  <span className="metric-card__value">{m.value}</span>
                  <span className="metric-card__label">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Full text collapsible */}
            <details className="transcript-full glass slide-up" style={{ animationDelay: '200ms' }}>
              <summary className="transcript-full__summary">
                <span className="transcript-full__label">Full Transcript Text</span>
                <svg className="transcript-full__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>
              <div className="transcript-full__body">
                <p>
                  {data.full_text || 'No full text available.'}
                </p>
              </div>
            </details>

            {/* Search */}
            <div className="transcript-search glass slide-up" style={{ animationDelay: '280ms' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="transcript-search__input"
                placeholder="Search segments..."
                id="transcript-search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Segments */}
            <div className="transcript-segments stagger">
              {segments.filter(seg => search === '' || (seg.text && seg.text.toLowerCase().includes(search.toLowerCase()))).length === 0 && <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>No segments match your search.</p>}
              {segments.filter(seg => search === '' || (seg.text && seg.text.toLowerCase().includes(search.toLowerCase()))).map((seg, idx) => (
                <div key={idx} className="segment-row">
                  <div className="segment-row__time">
                    <span className="segment-row__timestamp">{fmt(seg.start)}</span>
                    <span className="segment-row__arrow">-</span>
                    <span className="segment-row__timestamp">{fmt(seg.end)}</span>
                  </div>
                  <p className="segment-row__text">{seg.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Transcript
