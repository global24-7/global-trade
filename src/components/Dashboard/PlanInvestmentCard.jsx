import { fmtMoney, fmtCountdown, planInvProgress } from '../../lib/utils.js'

export default function PlanInvestmentCard({ inv, onCollect }) {
  const { pct, isReady } = planInvProgress(inv)
  const isCollected = inv.status === 'collected'

  return (
    <div className="inv-card">
      <div className="inv-card-header">
        <span style={{ fontWeight: 700 }}>{inv.plan_name}</span>
        <span className={`chip ${isCollected ? 'chip-blue' : isReady ? 'chip-green' : 'chip-yellow'}`}>
          {isCollected ? '✔ Collected' : isReady ? '✅ Ready' : `⏱ ${pct}%`}
        </span>
      </div>

      <div className="flex-between text-sm text-muted"><span>Invested</span><span>{fmtMoney(inv.invest_amount)}</span></div>
      <div className="flex-between text-sm mt-1">
        <span className="text-muted">You receive</span>
        <span className="text-gold fw-700">{fmtMoney(inv.user_return)}</span>
      </div>
      <div className="flex-between text-sm mt-1">
        <span className="text-muted">Admin fee</span>
        <span className="text-red text-xs">− {fmtMoney(inv.admin_fee)}</span>
      </div>

      <div className="progress-bg mt-1">
        <div className="progress-fill" style={{
          width: `${isReady || isCollected ? 100 : pct}%`,
          background: isReady ? 'linear-gradient(90deg,#059669,#34d399)' : undefined
        }} />
      </div>

      {!isCollected && (
        <div className="text-xs text-muted mt-1" style={{ fontFamily: 'monospace' }}>
          {isReady ? 'Timer complete — collect your return below' : `Time remaining: ${fmtCountdown(inv.end_date)}`}
        </div>
      )}

      {isReady && !isCollected && (
        <button className="btn btn-green" style={{ width: '100%', borderRadius: 12, marginTop: '.8rem', padding: '.7rem', justifyContent: 'center' }} onClick={onCollect}>
          <i className="fas fa-wallet" /> Collect Return — {fmtMoney(inv.user_return)}
        </button>
      )}

      {!isReady && !isCollected && (
        <div style={{ textAlign: 'center', marginTop: '.6rem', fontSize: '.75rem', color: 'var(--muted)' }}>
          <i className="fas fa-lock" style={{ marginRight: 4 }} /> Cannot withdraw before timer ends
        </div>
      )}
    </div>
  )
}
