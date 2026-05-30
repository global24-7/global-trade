// =============================================
// GLOBAL TRADE — UTILITY FUNCTIONS
// =============================================

export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'kingdevilgh.com'
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '233500643544'
export const TELECEL_1 = import.meta.env.VITE_TELECEL_1 || '0505477790'
export const TELECEL_2 = import.meta.env.VITE_TELECEL_2 || '0500643544'
export const MIN_DEPOSIT = Number(import.meta.env.VITE_MIN_DEPOSIT) || 50
export const ADMIN_FEE_PCT = Number(import.meta.env.VITE_ADMIN_FEE_PCT) || 0.10
export const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

/** Format a number as GHS currency */
export function fmtMoney(n) {
  return 'GHS ' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Format a date in en-GH locale */
export function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Format a datetime with time included */
export function fmtDateTime(d) {
  return new Date(d).toLocaleString('en-GH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Format hours as "12h", "2d", "2d 4h" */
export function fmtDuration(hours) {
  if (hours < 24) return hours + 'h'
  const d = Math.floor(hours / 24), h = hours % 24
  return d + 'd' + (h ? ' ' + h + 'h' : '')
}

/** Live countdown from an ISO end date string → "HH:MM:SS" */
export function fmtCountdown(endDateStr) {
  const ms = new Date(endDateStr) - new Date()
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

/** Generate a unique investor code */
export function generateCode() {
  return 'GT-' + Math.random().toString(36).substring(2, 7).toUpperCase()
}

/** Compute investment progress stats */
export function invProgress(inv) {
  const start = new Date(inv.start_date)
  const end = new Date(inv.end_date)
  const now = new Date()
  const totalMs = inv.duration_days * 86_400_000
  const elapsed = Math.min(Math.max(now - start, 0), totalMs)
  const pct = Math.round((elapsed / totalMs) * 100)
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 3600 * 24)))
  const daysElapsed = inv.duration_days - daysLeft
  const earnedSoFar = Math.min((inv.return_amount / inv.duration_days) * daysElapsed, inv.return_amount)
  const isComplete = now >= end || inv.status === 'completed'
  return { pct, daysLeft, earnedSoFar, isComplete }
}

/** Compute plan investment progress stats */
export function planInvProgress(inv) {
  const start = new Date(inv.start_date)
  const end = new Date(inv.end_date)
  const now = new Date()
  const totalMs = inv.duration_hours * 3_600_000
  const elapsed = Math.min(Math.max(now - start, 0), totalMs)
  const pct = Math.round((elapsed / totalMs) * 100)
  const isReady = now >= end || inv.status === 'ready'
  return { pct, isReady }
}

/** Build a WhatsApp deep-link with a pre-filled message */
export function waLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

/** Open Paystack checkout popup. Returns a Promise that resolves on success or rejects on close. */
export function openPaystack({ email, amount, ref, userCode, onSuccess, onClose }) {
  return new Promise((resolve, reject) => {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_KEY,
      email,
      amount: Math.round(amount * 100), // Paystack uses pesewas
      currency: 'GHS',
      ref,
      metadata: {
        custom_fields: [{ display_name: 'User Code', variable_name: 'user_code', value: userCode }],
      },
      callback: (response) => { onSuccess && onSuccess(response); resolve(response) },
      onClose: () => { onClose && onClose(); reject(new Error('closed')) },
    })
    handler.openIframe()
  })
}
