import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Sessions from './pages/Sessions'
import Transcript from './pages/Transcript'
import Player from './pages/Player'
import Chunks from './pages/Chunks'
import './App.css'

function App() {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 50)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="app-root">
      <div className="ambient-glow" />
      <div className="grain-overlay" />
      <Navbar />
      <main className={`main-content ${isTransitioning ? 'page-exit' : 'page-enter'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/transcript" element={<Transcript />} />
          <Route path="/transcript/:audioId" element={<Transcript />} />
          <Route path="/player" element={<Player />} />
          <Route path="/player/:audioId" element={<Player />} />
          <Route path="/chunks" element={<Chunks />} />
          <Route path="/chunks/:audioId" element={<Chunks />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
