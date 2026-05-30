import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { createPlanInvestment, updateUserBalance, createTransaction } from '../../lib/db.js'
import { fmtMoney, fmtDuration, ADMIN_FEE_PCT } from '../../lib/utils.js'

export default function PlanInvestModal({ plan, onClose, onSuccess }) {
  const { user, refreshUser, toast } = useApp()
  const [loading, setLoading] = useState(false)

  const profit = plan.invest_amount * (plan.interest_pct / 100)
  const total = plan.invest_amount + profit
  const adminFee = total * ADMIN_FEE_PCT
  const userReturn = total - adminFee

  async function handleInvest() {
    setLoading(true)
    try {
      const fresh = await refreshUser()
      const balance = fresh?.wallet_balance || 0
      if (balance < plan.invest_amount) {
        toast('Insufficient wallet balance. Please deposit funds first.', 'error')
        return
      }
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + plan.duration_hours * 3_600_000)

      await updateUserBalance(user.id, balance - plan.invest_amount)
      await createPlanInvestment({
        id: crypto.randomUUID(),
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        invest_amount: plan.invest_amount,
        interest_pct: plan.interest_pct,
        profit,
        admin_fee: adminFee,
        user_return: userReturn,
        duration_hours: plan.duration_hours,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        img: plan.img,
        created_at: new Date().toISOString()
      })
      await createTransaction({
        user_id: user.id, type: 'plan_investment', amount: plan.invest_amount,
        note: `Started ${plan.name}`, created_at: new Date().toISOString()
      })
      toast(`${plan.name} started! Returns in ${fmtDuration(plan.duration_hours)}.`, 'success')
      onSuccess?.()
    } catch (e) {
      toast(e.message || 'Investment failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const balance = user?.wallet_balance || 0
  const canAfford = balance >= plan.invest_amount

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>Start {plan.name}</h3>

        <div className="inv-card" style={{ marginBottom: '1rem' }}>
          {[
            ['Plan', plan.name],
            ['Investment', fmtMoney(plan.invest_amount)],
            ['Interest', `${plan.interest_pct}%`],
            ['Gross Return', fmtMoney(total)],
            ['Admin Fee (10%)', `− ${fmtMoney(adminFee)}`, 'red'],
            ['You Receive', fmtMoney(userReturn), 'gold'],
            ['Duration', fmtDuration(plan.duration_hours)],
          ].map(([label, val, color]) => (
            <div key={label} className="flex-between text-sm" style={{ marginBottom: '.5rem' }}>
              <span className="text-muted">{label}</span>
              <strong style={{ color: color === 'gold' ? 'var(--gold2)' : color === 'red' ? '#f87171' : undefined }}>{val}</strong>
            </div>
          ))}
        </div>

        <div style={{ padding: '.8rem 1rem', background: canAfford ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${canAfford ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 10 }}>
          <div className="flex-between text-sm">
            <span className="text-muted">Your balance</span>
            <span style={{ color: canAfford ? '#34d399' : '#f87171', fontWeight: 700 }}>{fmtMoney(balance)}</span>
          </div>
        </div>

        {canAfford ? (
          <button className="btn btn-blue btn-block" style={{ marginTop: '1rem' }} onClick={handleInvest} disabled={loading}>
            {loading ? <><span className="spinner" /> Starting...</> : <><i className="fas fa-play" /> Start Plan</>}
          </button>
        ) : (
          <div style={{ marginTop: '1rem', textAlign: 'center', color: '#f87171', fontSize: '.88rem', padding: '1rem', background: 'rgba(220,38,38,0.07)', borderRadius: 10 }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }} />
            Insufficient balance. Deposit {fmtMoney(plan.invest_amount - balance)} more.
          </div>
        )}
      </div>
    </div>
  )
}
