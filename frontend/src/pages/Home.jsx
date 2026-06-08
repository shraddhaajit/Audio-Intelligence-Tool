import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__content slide-up">
          <p className="hero__overline">Audio Intelligence System</p>
          <h1 className="hero__title">
            Transform audio<br />
            <span className="hero__title-accent">into knowledge</span>
          </h1>
          <p className="hero__subtitle">
            Extract, transcribe, and structure audio content into searchable,
            semantically-chunked data — ready for retrieval and analysis.
          </p>
          <div className="hero__actions">
            <Link to="/upload" className="btn btn--primary" id="hero-upload-btn">
              Start Processing
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/sessions" className="btn btn--ghost" id="hero-sessions-btn">
              View Sessions
            </Link>
          </div>
        </div>

        <div className="hero__visual slide-up" style={{ animationDelay: '200ms' }}>
          <div className="hero__waveform">
            {Array.from({ length: 48 }, (_, i) => (
              <div
                key={i}
                className="hero__wave-bar"
                style={{
                  '--i': i,
                  '--h': `${20 + Math.sin(i * 0.4) * 30 + Math.random() * 25}%`,
                  animationDelay: `${i * 60}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline section */}
      <section className="pipeline">
        <div className="pipeline__header slide-up">
          <p className="section-overline">How it works</p>
          <h2 className="section-title">End-to-end pipeline</h2>
        </div>
        <div className="pipeline__grid stagger">
          {[
            {
              step: '01',
              title: 'Ingest',
              desc: 'Upload audio files or provide YouTube URLs. Supports MP3, WAV, M4A, OGG, FLAC, and WebM formats.',
            },
            {
              step: '02',
              title: 'Transcribe',
              desc: 'Whisper-powered transcription generates timestamped segments with high accuracy across languages.',
            },
            {
              step: '03',
              title: 'Chunk',
              desc: 'Semantic chunking produces 400-500 word segments with 100-word overlap for optimal retrieval.',
            },
            {
              step: '04',
              title: 'Retrieve',
              desc: 'Structured JSON output ready for downstream search, embedding, and evidence retrieval systems.',
            },
          ].map(item => (
            <div key={item.step} className="pipeline__card glass">
              <span className="pipeline__step">{item.step}</span>
              <h3 className="pipeline__card-title">{item.title}</h3>
              <p className="pipeline__card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="stats slide-up">
        <div className="stats__inner glass">
          {[
            { value: '5', label: 'API Endpoints' },
            { value: '6+', label: 'Audio Formats' },
            { value: '100+', label: 'Languages' },
            { value: 'Real-time', label: 'Processing' },
          ].map((s, i) => (
            <div key={i} className="stat">
              <span className="stat__value">{s.value}</span>
              <span className="stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta slide-up">
        <div className="cta__inner">
          <h2 className="cta__title">Ready to begin</h2>
          <p className="cta__desc">
            Upload your first audio file and watch the pipeline transform it
            into structured, searchable chunks.
          </p>
          <Link to="/upload" className="btn btn--primary btn--lg" id="cta-upload-btn">
            Upload Audio
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <span className="footer__brand">Audio Intelligence</span>
          <span className="footer__meta">Evidence Retrieval System</span>
        </div>
      </footer>
    </div>
  )
}

export default Home
