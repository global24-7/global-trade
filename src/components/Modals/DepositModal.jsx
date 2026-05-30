import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { createDepositRequest, createTransaction, updateUserBalance, uploadScreenshot } from '../../lib/db.js'
import { openPaystack, MIN_DEPOSIT, TELECEL_1, TELECEL_2, WHATSAPP_NUMBER, waLink } from '../../lib/utils.js'

export default function DepositModal({ onClose, onSuccess }) {
  const { user, refreshUser, toast } = useApp()
  const [tab, setTab] = useState('choose') // choose | paystack | telecel
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  async function handlePaystack() {
    const amt = parseFloat(amount)
    if (!amt || amt < MIN_DEPOSIT) return toast(`Minimum deposit is GHS ${MIN_DEPOSIT}`, 'error')
    setLoading(true)
    try {
      const response = await openPaystack({
        email: user.email,
        amount: amt,
        ref: 'GT-' + Date.now(),
        userCode: user.unique_code,
      })
      // Credit wallet
      const fresh = await refreshUser()
      await updateUserBalance(user.id, (fresh?.wallet_balance || 0) + amt)
      await createTransaction({
        user_id: user.id, type: 'deposit', amount: amt,
        note: 'Paystack payment ref: ' + response.reference,
        created_at: new Date().toISOString()
      })
      toast(`GHS ${amt.toFixed(2)} added to wallet!`, 'success')
      onSuccess?.()
    } catch (e) {
      if (e.message !== 'closed') toast('Payment failed or cancelled', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleTelecelSubmit() {
    const amt = parseFloat(amount)
    if (!amt || amt < MIN_DEPOSIT) return toast(`Minimum deposit is GHS ${MIN_DEPOSIT}`, 'error')
    setLoading(true)
    try {
      let screenshotUrl = null
      if (file) {
        screenshotUrl = await uploadScreenshot(file, user.id).catch(() => null)
      }
      await createDepositRequest({
        id: 'dep' + Date.now(),
        user_id: user.id, user_name: user.full_name, user_code: user.unique_code,
        amount: amt, method: 'Telecel', status: 'pending',
        screenshot_url: screenshotUrl, created_at: new Date().toISOString()
      })
      await createTransaction({
        user_id: user.id, type: 'deposit_pending', amount: amt,
        note: 'Pending manual approval', created_at: new Date().toISOString()
      })
      onSuccess?.()
      toast('Deposit request submitted! Admin will approve soon.', 'success')
      setTimeout(() => {
        const msg = `💰 *DEPOSIT REQUEST*\nUser: ${user.full_name}\nCode: ${user.unique_code}\nAmount: GHS ${amt}\nPlease approve my deposit.`
        window.open(waLink(msg), '_blank')
      }, 800)
    } catch (e) {
      toast(e.message || 'Submission failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-wide">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>Add Funds to Wallet</h3>

        {/* Method chooser */}
        {tab === 'choose' && (
          <div>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '.9rem' }}>Choose your preferred deposit method:</p>
            <div className="grid-2">
              <button onClick={() => setTab('paystack')} style={{
                background: 'var(--bg3)', border: '1.5px solid var(--border2)', borderRadius: 16,
                padding: '1.5rem', cursor: 'pointer', color: 'var(--text)', textAlign: 'center', transition: '.2s'
              }}>
                <i className="fas fa-credit-card" style={{ fontSize: '1.8rem', color: 'var(--gold2)', marginBottom: '.7rem', display: 'block' }} />
                <strong>Card / Paystack</strong>
                <div className="text-xs text-muted mt-1">Instant. Visa, Mastercard, Mobile Money</div>
              </button>
              <button onClick={() => setTab('telecel')} style={{
                background: 'var(--bg3)', border: '1.5px solid var(--border2)', borderRadius: 16,
                padding: '1.5rem', cursor: 'pointer', color: 'var(--text)', textAlign: 'center', transition: '.2s'
              }}>
                <i className="fas fa-mobile-alt" style={{ fontSize: '1.8rem', color: 'var(--gold2)', marginBottom: '.7rem', display: 'block' }} />
                <strong>Telecel Cash</strong>
                <div className="text-xs text-muted mt-1">Manual transfer. Admin approves within 1h</div>
              </button>
            </div>
          </div>
        )}

        {/* Paystack */}
        {tab === 'paystack' && (
          <div>
            <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '1.2rem' }}>
              Pay securely with your card via Paystack. Balance credited instantly.
            </p>
            <div className="form-group">
              <label>Amount (GHS) — Min: GHS {MIN_DEPOSIT}</label>
              <input type="number" className="input" placeholder={`e.g. 200`} min={MIN_DEPOSIT}
                value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <button className="btn btn-gold btn-block" onClick={handlePaystack} disabled={loading}>
              {loading ? <><span className="spinner" /> Processing...</> : <><i className="fas fa-lock" /> Pay Securely with Paystack</>}
            </button>
            <p className="text-xs text-muted mt-1" style={{ textAlign: 'center' }}>
              <i className="fas fa-shield-alt" style={{ marginRight: 4 }} />256-bit SSL encrypted.
            </p>
            <button onClick={() => setTab('choose')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'block', margin: '1rem auto 0', fontSize: '.84rem' }}>
              ← Back
            </button>
          </div>
        )}

        {/* Telecel */}
        {tab === 'telecel' && (
          <div>
            <div style={{ marginBottom: '1.4rem' }}>
              {[
                { num: 1, title: 'Send Mobile Money', desc: 'Send your deposit to one of these Telecel Cash numbers:' },
                { num: 2, title: 'Take a Screenshot', desc: 'Capture proof of your Telecel Cash transfer.' },
                { num: 3, title: 'Upload & Submit', desc: 'Upload the screenshot and enter the amount below to submit.' },
              ].map(step => (
                <div key={step.num} className="deposit-step">
                  <div className="step-num">{step.num}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                    {step.num === 1 && (
                      <div style={{ marginTop: '.5rem' }}>
                        <span className="phone-pill"><i className="fas fa-mobile-alt" /> {TELECEL_1}</span>
                        <span className="phone-pill"><i className="fas fa-mobile-alt" /> {TELECEL_2}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Amount Sent (GHS) — Min: GHS {MIN_DEPOSIT}</label>
              <input type="number" className="input" placeholder="Enter amount" min={MIN_DEPOSIT}
                value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Upload Transfer Screenshot (optional but recommended)</label>
              <div className="upload-zone">
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12 }} />
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '.5rem', display: 'block' }} />
                    <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Tap to upload screenshot</div>
                  </>
                )}
              </div>
            </div>

            <button className="btn btn-gold btn-block" onClick={handleTelecelSubmit} disabled={loading}>
              {loading ? <><span className="spinner" /> Submitting...</> : <><i className="fas fa-paper-plane" /> Submit Deposit Request</>}
            </button>
            <button onClick={() => setTab('choose')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'block', margin: '1rem auto 0', fontSize: '.84rem' }}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
