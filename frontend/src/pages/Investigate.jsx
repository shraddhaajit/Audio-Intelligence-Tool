import { useState } from 'react'
import { API_BASE } from '../utils/api'
import './Investigate.css'

function Investigate() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const data = await res.json()
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to query the AI')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container investigate-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Investigate</h1>
        <p className="page-subtitle">Ask questions across your entire audio library</p>
      </div>

      <div className="investigate-content">
        <form className="query-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
            </svg>
            <input
              type="text"
              className="query-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What were the key decisions made in the last meeting?"
              disabled={loading}
              id="ai-query-input"
            />
            <button 
              type="submit" 
              className={`query-btn ${loading ? 'loading' : ''}`}
              disabled={loading || !question.trim()}
              id="ai-query-submit"
            >
              {loading ? 'Analyzing...' : 'Ask AI'}
            </button>
          </div>
        </form>

        {error && (
          <div className="query-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
            </svg>
            {error}
          </div>
        )}

        {result && (
          <div className="query-result slide-up">
            <div className="result-header">
              <h2 className="answer-title">AI Analysis</h2>
            </div>

            <div className="answer-box">
              <p className="answer-text">{result.answer}</p>
            </div>

            <details className="evidence-accordion">
              <summary className="evidence-title">View Supporting Evidence ({result.evidence?.length || 0} sources)</summary>
              <div className="evidence-list">
                {result.evidence && result.evidence.map((item, idx) => (
                  <div key={idx} className="evidence-card">
                    <div className="evidence-meta">
                      <span className="evidence-source">{item.source || 'Unknown Source'}</span>
                      <span className="evidence-time">
                        {item.timestamp || '00:00'}
                      </span>
                    </div>
                    <p className="evidence-text">"{item.text}"</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

export default Investigate
