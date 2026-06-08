import { useState, useEffect } from 'react'
import { API_BASE } from '../utils/api'
import './Upload.css'

function Upload() {
  const [activeTab, setActiveTab] = useState('file')
  const [dragActive, setDragActive] = useState(false)
  
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioId, setAudioId] = useState(null)
  const [statusData, setStatusData] = useState(null)
  const [error, setError] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (activeTab === 'file' && !file) return;
    if (activeTab === 'url' && !url) return;

    setIsProcessing(true)
    setError(null)
    setAudioId(null)
    setStatusData(null)

    const formData = new FormData()
    if (activeTab === 'file') {
      formData.append('file', file)
    } else {
      formData.append('url', url)
    }

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      
      setAudioId(data.audio_id)
    } catch (err) {
      setError(err.message)
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    let intervalId;
    
    if (audioId && (!statusData || (statusData.status !== 'processed' && statusData.status !== 'error'))) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/status?audio_id=${audioId}`)
          const data = await res.json()
          if (res.ok) {
            setStatusData(data)
            if (data.status === 'processed' || data.status === 'error') {
              setIsProcessing(false)
              clearInterval(intervalId)
            }
          } else {
            // Stop polling if the session is not found or other errors
            setIsProcessing(false)
            clearInterval(intervalId)
            setError("Failed to fetch status or session deleted.")
          }
        } catch (err) {
          console.error("Failed to fetch status", err)
        }
      }, 2000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [audioId, statusData])


  const getStageStatus = (stageName, currentStatus) => {
    const stages = ['uploaded', 'processing', 'transcribing', 'chunking', 'processed']
    const currentIndex = stages.indexOf(currentStatus)
    
    let targetIndex = 0;
    if (stageName === 'Upload') targetIndex = 0;
    if (stageName === 'Extract') targetIndex = 1;
    if (stageName === 'Transcribe') targetIndex = 2;
    if (stageName === 'Chunk') targetIndex = 3;

    if (currentStatus === 'error') return 'error';
    if (currentIndex > targetIndex || currentStatus === 'processed') return 'done';
    if (currentIndex === targetIndex) return 'processing';
    return 'idle';
  }

  const overallStatus = statusData ? statusData.status : (isProcessing ? 'processing' : 'idle')

  return (
    <div className="upload-page">
      <div className="upload-page__inner">
        <div className="upload-page__header slide-up">
          <p className="section-overline">Ingest</p>
          <h1 className="section-title">Upload Audio</h1>
          <p className="upload-page__desc">
            Provide an audio file or a URL to begin the transcription and chunking pipeline.
          </p>
        </div>

        <div className="upload-card glass slide-up" style={{ animationDelay: '120ms' }}>
          <div className="upload-tabs">
            <button
              className={`upload-tab ${activeTab === 'file' ? 'upload-tab--active' : ''}`}
              onClick={() => setActiveTab('file')}
              id="tab-file-upload"
            >
              File Upload
            </button>
            <button
              className={`upload-tab ${activeTab === 'url' ? 'upload-tab--active' : ''}`}
              onClick={() => setActiveTab('url')}
              id="tab-url-upload"
            >
              URL Import
            </button>
            <div
              className="upload-tabs__slider"
              style={{ transform: activeTab === 'url' ? 'translateX(100%)' : 'translateX(0)' }}
            />
          </div>

          {activeTab === 'file' && (
            <div className="upload-body fade-in">
              <div
                className={`drop-zone ${dragActive ? 'drop-zone--active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                id="file-drop-zone"
              >
                <div className="drop-zone__icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6v20M12 14l8-8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 26v4a4 4 0 004 4h20a4 4 0 004-4v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {file ? (
                  <p className="drop-zone__title">{file.name}</p>
                ) : (
                  <>
                    <p className="drop-zone__title">Drop audio files here</p>
                    <p className="drop-zone__hint">or click to browse</p>
                    <p className="drop-zone__formats">MP3, WAV, M4A, OGG, FLAC, WebM</p>
                  </>
                )}
                <input
                  type="file"
                  className="drop-zone__input"
                  accept=".mp3,.wav,.m4a,.ogg,.flac,.webm"
                  id="file-input"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="upload-body fade-in">
              <div className="url-form">
                <label className="url-form__label" htmlFor="url-input">
                  Source URL
                </label>
                <div className="url-form__field">
                  <input
                    type="url"
                    className="url-form__input"
                    placeholder="https://youtube.com/watch?v=..."
                    id="url-input"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                  />
                </div>
                <p className="url-form__hint">
                  Supports YouTube, direct audio links, and other media URLs.
                </p>
              </div>
            </div>
          )}

          <div className="upload-actions">
            <button 
              className="btn btn--primary btn--lg upload-submit" 
              id="process-btn"
              onClick={handleSubmit}
              disabled={isProcessing}
              style={{ opacity: isProcessing ? 0.7 : 1 }}
            >
              {isProcessing ? 'Processing...' : 'Process Audio'}
              {!isProcessing && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            {error && <p style={{ color: '#e57373', marginTop: '1rem', fontSize: '0.85rem' }}>Error: {error}</p>}
          </div>
        </div>

        {/* Processing status */}
        <div className="status-section slide-up" style={{ animationDelay: '240ms' }}>
          <div className="status-card glass">
            <div className="status-card__header">
              <h3 className="status-card__title">Processing Status</h3>
              <span className={`status-badge status-badge--${overallStatus === 'processed' ? 'done' : overallStatus}`}>
                {overallStatus}
              </span>
            </div>
            <div className="status-stages">
              {['Upload', 'Extract', 'Transcribe', 'Chunk'].map((stage, i) => {
                const stageStatus = getStageStatus(stage, statusData?.status || (isProcessing ? 'uploaded' : 'idle'));
                return (
                  <div key={stage} className={`status-stage`}>
                    <div className="status-stage__dot" style={{
                      background: stageStatus === 'done' ? '#81c784' : stageStatus === 'processing' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                      borderColor: stageStatus === 'done' ? '#81c784' : stageStatus === 'processing' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                    }} />
                    <span className="status-stage__label">{stage}</span>
                    {i < 3 && <div className="status-stage__connector" style={{
                       background: stageStatus === 'done' ? '#81c784' : 'rgba(255, 255, 255, 0.06)'
                    }} />}
                  </div>
                )
              })}
            </div>
            {statusData?.error_message && (
               <p style={{ color: '#e57373', marginTop: '1rem', fontSize: '0.85rem' }}>Error: {statusData.error_message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload
