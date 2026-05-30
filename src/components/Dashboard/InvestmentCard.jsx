import { fmtMoney, fmtDate, invProgress } from '../../lib/utils.js'

export default function InvestmentCard({ inv, onWithdraw }) {
  const { pct, daysLeft, earnedSoFar, isComplete } = invProgress(inv)

  return (
    <div className="inv-card">
      <div className="inv-card-header">
        <span style={{ fontWeight: 700 }}>{inv.package_name}</span>
        <span className={`chip ${isComplete ? 'chip-green' : 'chip-yellow'}`}>
          {inv.withdrawal_requested ? '⏳ Withdrawal Pending'
            : isComplete ? '✅ Complete'
            : `${pct}% complete`}
        </span>
      </div>

      <div className="flex-between text-sm text-muted"><span>Invested</span><span>{fmtMoney(inv.invest_amount)}</span></div>
      <div className="flex-between text-sm mt-1">
        <span className="text-muted">Return progress</span>
        <span className="text-gold fw-700">{fmtMoney(earnedSoFar)} / {fmtMoney(inv.return_amount)}</span>
      </div>

      <div className="progress-bg mt-1">
        <div className="progress-fill" style={{ width: `${pct}%`, background: isComplete ? 'linear-gradient(90deg,#059669,#34d399)' : undefined }} />
      </div>

      <div className="text-xs text-muted mt-1">
        {isComplete
          ? `Completed · ${fmtDate(inv.end_date)}`
          : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining · Ends ${fmtDate(inv.end_date)}`}
      </div>

      {isComplete && !inv.withdrawal_requested && (
        <button className="btn btn-green" style={{ width: '100%', borderRadius: 12, marginTop: '.8rem', padding: '.7rem', justifyContent: 'center' }} onClick={onWithdraw}>
          <i className="fas fa-wallet" /> Request Withdrawal — {fmtMoney(inv.return_amount)}
        </button>
      )}

      {inv.withdrawal_requested && (
        <div style={{ textAlign: 'center', marginTop: '.8rem', fontSize: '.8rem', color: 'var(--muted)', background: 'rgba(201,168,76,0.05)', borderRadius: 10, padding: '.6rem' }}>
          <i className="fas fa-hourglass-half" style={{ marginRight: 6, color: 'var(--gold2)' }} />
          Withdrawal under review. Admin will process within 24h.
        </div>
      )}
    </div>
  )
}
