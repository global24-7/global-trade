export default function AssetCards({ packages, onInvest }) {
  return (
    <section id="packages">
      <div className="section-head">
        <span className="section-label">Investment Packages</span>
        <h2 className="section-title">Luxury Vehicle Portfolios</h2>
        <p className="section-sub">Invest in world-renowned luxury vehicles and earn exceptional returns over a fixed duration.</p>
      </div>
      <div className="grid-3">
        {packages.filter(p => p.status === 'active').map(pkg => (
          <div
            key={pkg.id}
            className="asset-card"
            onClick={onInvest}
            style={{
              background: 'var(--card)', border: '1px solid var(--border2)',
              borderRadius: 'var(--r2)', padding: '1.6rem',
              transition: '.3s', cursor: 'pointer', position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{
              width: '100%', height: 145, borderRadius: 16, marginBottom: '1.1rem',
              overflow: 'hidden', background: 'var(--bg3)'
            }}>
              <img src={pkg.img} alt={pkg.name} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '.3rem' }}>{pkg.name}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 800, color: 'var(--gold2)' }}>{pkg.roi}</div>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)', margin: '.3rem 0' }}>
              Invest GHS {pkg.invest_amount} → Get GHS {Number(pkg.return_amount).toFixed(2)}
            </div>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
              <i className="fas fa-clock" /> {pkg.duration_days} days duration
            </div>
            <div style={{ display: 'inline-block', background: 'rgba(5,150,105,0.15)', color: '#34d399', borderRadius: 40, padding: '.15rem .7rem', fontSize: '.7rem', fontWeight: 600, marginTop: '.4rem' }}>
              Active
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
