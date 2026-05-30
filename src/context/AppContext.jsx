import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getPackages, getPlans, getUserById } from '../lib/db.js'

// ---- Context creation ----
const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

// ---- Toast hook ----
export function useToast() {
  const ctx = useContext(AppContext)
  return ctx.toast
}

const SESSION_KEY = 'gt_session'

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
}
function setSession(data) { localStorage.setItem(SESSION_KEY, JSON.stringify(data)) }
function clearSession() { localStorage.removeItem(SESSION_KEY) }

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [packages, setPackages] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [toastState, setToastState] = useState({ msg: '', type: 'info', show: false })
  const toastTimer = useRef(null)

  // ---- Toast ----
  const toast = useCallback((msg, type = 'info') => {
    setToastState({ msg, type, show: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastState(s => ({ ...s, show: false })), 3800)
  }, [])

  // ---- Auth helpers ----
  const login = useCallback((userData) => {
    setUser(userData)
    setSession({ id: userData.id })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    clearSession()
  }, [])

  const refreshUser = useCallback(async () => {
    if (!user) return
    try {
      const fresh = await getUserById(user.id)
      setUser(fresh)
      return fresh
    } catch { return user }
  }, [user])

  // ---- App initialization ----
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [pkgs, plns] = await Promise.all([getPackages(), getPlans()])
        setPackages(pkgs)
        setPlans(plns)

        const sess = getSession()
        if (sess?.id) {
          const u = await getUserById(sess.id).catch(() => null)
          if (u) setUser(u)
          else clearSession()
        }
      } catch (e) {
        console.error('App init error:', e)
      }
      setLoading(false)
    }
    init()
  }, [])

  // ---- Auto-refresh user every 60s ----
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      getUserById(user.id).then(u => { if (u) setUser(u) }).catch(() => {})
    }, 60_000)
    return () => clearInterval(interval)
  }, [user?.id])

  return (
    <AppContext.Provider value={{
      user, setUser, login, logout, refreshUser,
      packages, setPackages,
      plans, setPlans,
      loading,
      toast, toastState,
    }}>
      {children}
    </AppContext.Provider>
  )
}
