import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Navbar.css'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const links = [
    { to: '/', label: 'Home' },
    { to: '/upload', label: 'Upload' },
    { to: '/sessions', label: 'Library' },
  ]

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__logo">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4C11.03 4 7 8.03 7 13v7a4 4 0 004 4h1a1 1 0 001-1v-7a1 1 0 00-1-1h-1v-2c0-3.31 2.69-6 6-6s6 2.69 6 6v2h-1a1 1 0 00-1 1v7a1 1 0 001 1h1a4 4 0 004-4v-7c0-4.97-4.03-9-9-9z" fill="currentColor"/>
            </svg>
          </span>
          <span className="navbar__title">Audio Intelligence</span>
        </NavLink>

        <button
          className={`navbar__toggle ${mobileOpen ? 'navbar__toggle--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          id="nav-toggle"
        >
          <span /><span /><span />
        </button>

        <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              {link.label}
              <span className="navbar__link-indicator" />
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
