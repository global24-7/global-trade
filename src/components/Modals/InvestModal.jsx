import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { createInvestment, updateUserBalance, createTransaction } from '../../lib/db.js'
import { fmtMoney } from '../../lib/utils.js'

export default function InvestModal({ pkg, onClose, onSuccess }) {
  const { user, refreshUser, toast } = useApp()
  const [loading, setLoading] = useState(false)

  async function handleInvest() {
    setLoading(true)
    try {
      const fresh = await refreshUser()
      const balance = fresh?.wallet_balance || 0
      if (balance < pkg.invest_amount) {
        toast('Insufficient wallet balance. Please deposit funds first.', 'error')
        return
      }
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + pkg.duration_days * 86_400_000)

      await updateUserBalance(user.id, balance - pkg.invest_amount)
      await createInvestment({
        id: crypto.randomUUID(),
        user_id: user.id,
        package_id: pkg.id,
        package_name: pkg.name,
        invest_amount: pkg.invest_amount,
        return_amount: pkg.return_amount,
        duration_days: pkg.duration_days,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        withdrawal_requested: false,
        created_at: new Date().toISOString()
      })
      await createTransaction({
        user_id: user.id, type: 'investment', amount: pkg.invest_amount,
        note: `Invested in ${pkg.name}`, created_at: new Date().toISOString()
      })
      toast(`Invested in ${pkg.name}! Returns in ${pkg.duration_days} days.`, 'success')
      onSuccess?.()
    } catch (e) {
      toast(e.message || 'Investment failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const balance = user?.wallet_balance || 0
  const canAfford = balance >= pkg.invest_amount

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>Confirm Investment</h3>

        <div style={{ width: '100%', height: 130, borderRadius: 14, overflow: 'hidden', marginBottom: '1.2rem', background: 'var(--bg3)' }}>
          <img src={pkg.img} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div className="inv-card">
          {[
            ['Package', pkg.name],
            ['Investment', fmtMoney(pkg.invest_amount)],
            ['Return', fmtMoney(pkg.return_amount), 'gold'],
            ['ROI', pkg.roi, 'gold'],
            ['Duration', `${pkg.duration_days} days`],
          ].map(([label, val, color]) => (
            <div key={label} className="flex-between text-sm" style={{ marginBottom: '.5rem' }}>
              <span className="text-muted">{label}</span>
              <strong style={{ color: color === 'gold' ? 'var(--gold2)' : undefined }}>{val}</strong>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', padding: '.8rem 1rem', background: canAfford ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${canAfford ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 10 }}>
          <div className="flex-between text-sm">
            <span className="text-muted">Your balance</span>
            <span style={{ color: canAfford ? '#34d399' : '#f87171', fontWeight: 700 }}>{fmtMoney(balance)}</span>
          </div>
          <div className="flex-between text-sm mt-1">
            <span className="text-muted">After investment</span>
            <span style={{ fontWeight: 700 }}>{fmtMoney(Math.max(0, balance - pkg.invest_amount))}</span>
          </div>
        </div>

        {canAfford ? (
          <button className="btn btn-gold btn-block" style={{ marginTop: '1rem' }} onClick={handleInvest} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing...</> : <><i className="fas fa-check" /> Confirm Investment</>}
          </button>
        ) : (
          <div style={{ marginTop: '1rem', textAlign: 'center', color: '#f87171', fontSize: '.88rem', padding: '1rem', background: 'rgba(220,38,38,0.07)', borderRadius: 10 }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }} />
            Insufficient balance. Please deposit at least {fmtMoney(pkg.invest_amount - balance)} more.
          </div>
        )}
      </div>
    </div>
  )
}
