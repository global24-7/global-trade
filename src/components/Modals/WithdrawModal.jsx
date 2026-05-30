import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { fmtMoney, fmtDateTime } from '../../lib/utils.js'
import { createWithdrawalRequest, getUserWithdrawalRequests } from '../../lib/db.js'

export default function WithdrawModal({ inv, onClose, onSuccess }) {
  const { user, toast } = useApp()
  const [momoName, setMomoName] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [network, setNetwork] = useState('Telecel')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!momoNumber.trim() || !momoName.trim()) return toast('Please fill all fields', 'error')
    setSubmitting(true)
    try {
      await createWithdrawalRequest({
        user_id: user.id,
        user_name: user.full_name,
        user_code: user.unique_code,
        investment_id: inv.id,
        package_name: inv.package_name,
        amount: inv.return_amount,
        momo_name: momoName.trim(),
        momo_number: momoNumber.trim(),
        network,
        status: 'pending',
      })
      setDone(true)
      toast('Withdrawal request submitted!', 'success')
      onSuccess && onSuccess()
    } catch (e) {
      toast(e.message || 'Submission failed', 'error')
    }
    setSubmitting(false)
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>Request Withdrawal</h3>

        {done ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#34d399', marginBottom: '1rem', display: 'block' }} />
            <h4 style={{ marginBottom: '.5rem' }}>Request Submitted!</h4>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
              Your withdrawal of <strong style={{ color: 'var(--gold2)' }}>{fmtMoney(inv.return_amount)}</strong> is under review.
              Our admin will process it within <strong>24 hours</strong>.
            </p>
            <button className="btn btn-gold btn-block" style={{ marginTop: '1.5rem', borderRadius: 12 }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div className="inv-card" style={{ marginBottom: '1.2rem' }}>
              {[
                ['Package', inv.package_name],
                ['Amount to Receive', fmtMoney(inv.return_amount), 'gold'],
              ].map(([label, val, color]) => (
                <div key={label} className="flex-between text-sm" style={{ marginBottom: '.5rem' }}>
                  <span className="text-muted">{label}</span>
                  <strong style={{ color: color === 'gold' ? 'var(--gold2)' : undefined }}>{val}</strong>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 12, padding: '.85rem', marginBottom: '1.2rem', fontSize: '.83rem', color: 'var(--muted)'
            }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--gold2)', marginRight: 6 }} />
              Enter the MoMo details you want the funds sent to. Admin will review and pay within 24h.
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Network</label>
                <select className="input" value={network} onChange={e => setNetwork(e.target.value)}>
                  <option value="Telecel">Telecel Cash</option>
                  <option value="MTN">MTN MoMo</option>
                  <option value="AirtelTigo">AirtelTigo Money</option>
                </select>
              </div>
              <div className="form-group">
                <label>MoMo Name</label>
                <input className="input" placeholder="Registered name on MoMo"
                  value={momoName} onChange={e => setMomoName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>MoMo Number</label>
                <input className="input" type="tel" placeholder="0XX XXX XXXX"
                  value={momoNumber} onChange={e => setMomoNumber(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-green btn-block" style={{ borderRadius: 12 }} disabled={submitting}>
                {submitting
                  ? <><span className="spinner" style={{ width: 16, height: 16, marginRight: 8 }} />Submitting...</>
                  : <><i className="fas fa-paper-plane" /> Submit Withdrawal Request</>
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
