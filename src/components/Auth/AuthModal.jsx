import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { getUserByEmail, createUser } from '../../lib/db.js'
import { generateCode } from '../../lib/utils.js'

export default function AuthModal({ mode: initialMode = 'login', onClose }) {
  const { login, toast } = useApp()
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)

  // Login fields
  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')

  // Register fields
  const [rName, setRName] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPhone, setRPhone] = useState('')
  const [rPass, setRPass] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!lEmail || !lPass) return toast('Please fill all fields', 'error')
    setLoading(true)
    try {
      const user = await getUserByEmail(lEmail.trim().toLowerCase())
      if (!user || user.password !== lPass) {
        toast('Invalid email or password', 'error')
        return
      }
      login(user)
      onClose()
      toast(`Welcome back, ${user.full_name}!`, 'success')
    } catch (e) {
      toast(e.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!rName || !rEmail || !rPass) return toast('Please fill all required fields', 'error')
    if (rPass.length < 6) return toast('Password must be at least 6 characters', 'error')
    setLoading(true)
    try {
      const existing = await getUserByEmail(rEmail.trim().toLowerCase())
      if (existing) { toast('Email already registered', 'error'); return }
      const user = await createUser({
        id: crypto.randomUUID(),
        full_name: rName.trim(),
        email: rEmail.trim().toLowerCase(),
        phone: rPhone.trim(),
        password: rPass, // NOTE: In production, hash via Netlify Function / Supabase Auth
        wallet_balance: 0,
        unique_code: generateCode(),
        created_at: new Date().toISOString(),
      })
      login(user)
      onClose()
      toast(`Welcome ${rName.trim()}! Your code: ${user.unique_code}`, 'success')
    } catch (e) {
      toast(e.message || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>{mode === 'register' ? 'Create Account' : 'Welcome Back'}</h3>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="you@email.com" value={lEmail} onChange={e => setLEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={lPass} onChange={e => setLPass(e.target.value)} required />
            </div>
            <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Logging in...</> : 'Login'}
            </button>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.84rem', marginTop: '1rem' }}>
              No account?{' '}
              <a href="#" style={{ color: 'var(--gold2)' }} onClick={e => { e.preventDefault(); setMode('register') }}>Register</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full Name</label>
              <input className="input" placeholder="John Doe" value={rName} onChange={e => setRName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="you@email.com" value={rEmail} onChange={e => setREmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input className="input" placeholder="+233..." value={rPhone} onChange={e => setRPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={rPass} onChange={e => setRPass(e.target.value)} required minLength={6} />
            </div>
            <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating Account...</> : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.84rem', marginTop: '1rem' }}>
              Already have an account?{' '}
              <a href="#" style={{ color: 'var(--gold2)' }} onClick={e => { e.preventDefault(); setMode('login') }}>Login</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
