import { fmtMoney, fmtDuration } from '../../lib/utils.js'

export default function PlanCards({ plans, onInvest }) {
  return (
    <section id="plans" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border2)' }}>
      <div className="section-head">
        <span className="section-label">Investment Plans</span>
        <h2 className="section-title">Timer-Based Returns</h2>
        <p className="section-sub">Deposit once, wait for your timer to complete, then collect your full return — including profit.</p>
      </div>
      <div className="grid-2" style={{ maxWidth: 900, margin: '0 auto' }}>
        {plans.filter(p => p.status === 'active').map(plan => {
          const profit = plan.invest_amount * (plan.interest_pct / 100)
          const total = plan.invest_amount + profit
          const adminFee = total * 0.10
          const userReturn = total - adminFee
          const tier = plan.name.toLowerCase().includes('diamond') ? 'diamond'
            : plan.name.toLowerCase().includes('gold') ? 'gold'
            : plan.name.toLowerCase().includes('silver') ? 'silver'
            : 'starter'
          const tierColor = tier === 'diamond' ? '#93c5fd' : tier === 'gold' ? 'var(--gold2)' : tier === 'silver' ? '#cbd5e1' : '#34d399'
          return (
            <div key={plan.id} style={{
              background: 'var(--card)', border: '1px solid var(--border2)',
              borderRadius: 'var(--r2)', padding: '1.6rem', transition: '.3s', cursor: 'pointer'
            }} onClick={onInvest}>
              <div style={{ width: '100%', height: 130, borderRadius: 14, overflow: 'hidden', marginBottom: '1.1rem', background: 'var(--bg3)' }}>
                <img src={plan.img} alt={plan.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', fontWeight: 700 }}>{plan.name}</div>
                <span style={{ background: 'rgba(201,168,76,0.1)', color: tierColor, border: `1px solid ${tierColor}40`, borderRadius: 40, padding: '.15rem .7rem', fontSize: '.7rem', fontWeight: 700 }}>
                  {plan.interest_pct}% Interest
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Invest</span>
                <strong>{fmtMoney(plan.invest_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>You receive</span>
                <strong style={{ color: 'var(--gold2)' }}>{fmtMoney(userReturn)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Duration</span>
                <span><i className="fas fa-clock" style={{ marginRight: 4 }} />{fmtDuration(plan.duration_hours)}</span>
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.6rem' }}>
                <i className="fas fa-info-circle" style={{ marginRight: 4 }} />10% admin fee deducted from profit
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
