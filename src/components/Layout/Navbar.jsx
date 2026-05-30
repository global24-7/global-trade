import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'

export default function Navbar({ onDeposit, onLogin, onRegister }) {
  const { user, logout } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <>
      <nav className="nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
        padding: '.9rem 4%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(6,11,20,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="logo" style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 800,
            background: 'linear-gradient(135deg,var(--gold2),var(--gold))',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            letterSpacing: '-0.5px'
          }}>Global Trade</div>
          <span style={{ fontSize: '.65rem', color: 'var(--muted)', display: 'block', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif", marginTop: '-4px' }}>
            Investment Platform
          </span>
        </div>

        <div className="nav-right" style={{ display: 'flex', gap: '.7rem', alignItems: 'center' }}>
          {user ? (
            <>
              <span className="code-badge" style={{ fontSize: '.75rem' }}>
                <i className="fas fa-id-card text-gold" />&nbsp;{user.unique_code}
              </span>
              {onDeposit && (
                <button className="btn btn-gold" onClick={onDeposit}>
                  <i className="fas fa-plus" /> Add Funds
                </button>
              )}
              <button className="btn btn-ghost" onClick={handleLogout} style={{ display: menuOpen ? 'none' : undefined }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onLogin} style={{ display: window.innerWidth <= 768 ? 'none' : undefined }}>Login</button>
              <button className="btn btn-gold" onClick={onRegister}>Get Started</button>
            </>
          )}
          <button
            className="hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <span style={{ width: 22, height: 2, background: 'var(--gold)', borderRadius: 2, display: 'block' }} />
            <span style={{ width: 22, height: 2, background: 'var(--gold)', borderRadius: 2, display: 'block' }} />
            <span style={{ width: 22, height: 2, background: 'var(--gold)', borderRadius: 2, display: 'block' }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 65, left: 0, right: 0,
          background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '.7rem', zIndex: 890
        }}>
          {user ? (
            <button className="btn btn-ghost" onClick={handleLogout} style={{ width: '100%', borderRadius: 10 }}>Logout</button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => { onLogin?.(); setMenuOpen(false) }} style={{ width: '100%', borderRadius: 10 }}>Login</button>
              <button className="btn btn-gold" onClick={() => { onRegister?.(); setMenuOpen(false) }} style={{ width: '100%', borderRadius: 10 }}>Register</button>
            </>
          )}
        </div>
      )}
    </>
  )
}
