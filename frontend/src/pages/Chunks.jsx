import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_BASE } from '../utils/api'
import './Chunks.css'

function Chunks() {
  const { audioId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!!audioId)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (audioId) {
      fetchChunks()
    }
  }, [audioId])

  const fetchChunks = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/chunks/${audioId}`)
      if (!res.ok) throw new Error('Failed to fetch chunks')
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
      <div className="chunks-page">
         <div className="chunks-page__inner" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <p className="section-overline">Retrieval-Ready</p>
            <h1 className="section-title">No Session Selected</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '2rem' }}>
              Please select a session from the library to view its chunks.
            </p>
            <Link to="/sessions" className="btn btn--primary">Go to Sessions</Link>
         </div>
      </div>
    )
  }

  const chunks = data?.chunks || []
  const totalWords = chunks.reduce((sum, c) => sum + (c.word_count || 0), 0)
  const avgWords = chunks.length > 0 ? Math.round(totalWords / chunks.length) : 0

  const handleDownload = () => {
    if (!chunks.length) return
    const blob = new Blob([JSON.stringify(chunks, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${audioId}_chunks.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="chunks-page">
      <div className="chunks-page__inner">
        <div className="chunks-page__header slide-up">
          <div className="chunks-page__top">
            <div>
              <p className="section-overline">Retrieval-Ready</p>
              <h1 className="section-title">
                Chunks / {audioId.substring(0, 8)}
              </h1>
            </div>
            {chunks.length > 0 && (
               <button className="btn btn--ghost" id="download-chunks-btn" onClick={handleDownload}>
                 Download JSON
                 <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                   <path d="M8 2v8M4 8l4 4 4-4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
               </button>
            )}
          </div>
          <p className="chunks-page__desc">
            Semantically chunked segments ready for downstream embedding and retrieval systems.
          </p>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading chunks...</p>}
        {error && <p style={{ color: '#e57373' }}>Error: {error}</p>}

        {data && data.status && data.status !== 'processed' && (
           <div className="metric-card glass" style={{ textAlign: 'left', marginBottom: '2rem' }}>
             <p>Status: <strong>{data.status}</strong></p>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chunks are not ready yet.</p>
           </div>
        )}

        {data && (!data.status || data.status === 'processed') && (
          <>
            {/* Summary bar */}
            <div className="chunks-summary glass slide-up" style={{ animationDelay: '80ms' }}>
              <div className="chunks-summary__item">
                <span className="chunks-summary__value">{chunks.length}</span>
                <span className="chunks-summary__label">Total Chunks</span>
              </div>
              <div className="chunks-summary__divider" />
              <div className="chunks-summary__item">
                <span className="chunks-summary__value">{totalWords}</span>
                <span className="chunks-summary__label">Total Words</span>
              </div>
              <div className="chunks-summary__divider" />
              <div className="chunks-summary__item">
                <span className="chunks-summary__value">{avgWords}</span>
                <span className="chunks-summary__label">Avg Words/Chunk</span>
              </div>
            </div>

            {/* Chunk cards */}
            <div className="chunks-list stagger">
              {chunks.map(chunk => (
                <div key={chunk.chunk_id} className="chunk-card glass">
                  <div className="chunk-card__header">
                    <div className="chunk-card__id">
                      <span className="chunk-card__num">#{chunk.chunk_id}</span>
                    </div>
                    <div className="chunk-card__meta">
                      <span className="chunk-card__time">
                        {chunk.start} - {chunk.end}
                      </span>
                      <span className="chunk-card__words">{chunk.word_count} words</span>
                    </div>
                  </div>
                  <p className="chunk-card__text">{chunk.text}</p>
                  <div className="chunk-card__footer">
                    <span className="chunk-card__source">{chunk.source}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* JSON Preview */}
            {chunks.length > 0 && (
              <details className="json-preview glass slide-up" style={{ animationDelay: '320ms' }}>
                <summary className="json-preview__summary">
                  <span className="json-preview__label">Raw JSON Preview (First Chunk)</span>
                  <svg className="json-preview__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </summary>
                <div className="json-preview__body">
                  <pre className="json-preview__code">
                    {JSON.stringify(chunks.slice(0, 1), null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Chunks
