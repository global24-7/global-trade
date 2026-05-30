const FEATURES = [
  { icon: 'fas fa-shield-alt', title: 'Secured Platform', desc: 'Bank-grade encryption protects every transaction and personal data on our platform.' },
  { icon: 'fas fa-clock',      title: 'Fixed Timelines', desc: 'Know exactly when your investment matures. No surprises, no hidden delays.' },
  { icon: 'fas fa-wallet',     title: 'Multiple Deposits', desc: 'Fund via Paystack card payment or Telecel Cash manual transfer — whichever you prefer.' },
  { icon: 'fas fa-chart-bar',  title: 'High Returns',     desc: 'Earn between 171% and 270% ROI across our luxury vehicle portfolio packages.' },
  { icon: 'fab fa-whatsapp',   title: '24/7 Support',     desc: 'Our support team is available round the clock on WhatsApp to assist with any issues.' },
  { icon: 'fas fa-user-check', title: 'Easy Onboarding',  desc: 'Create your account in under 2 minutes. No complex KYC for standard investments.' },
]

export default function Features() {
  return (
    <section id="features">
      <div className="section-head">
        <span className="section-label">Why Global Trade</span>
        <h2 className="section-title">Built for Serious Investors</h2>
        <p className="section-sub">Everything you need to invest with confidence.</p>
      </div>
      <div className="grid-3">
        {FEATURES.map(f => (
          <div key={f.title} style={{
            background: 'var(--card)', border: '1px solid var(--border2)',
            borderRadius: 'var(--r2)', padding: '2rem', transition: '.3s'
          }}>
            <div style={{
              width: 50, height: 50,
              background: 'linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', marginBottom: '1.2rem', color: 'var(--gold2)'
            }}>
              <i className={f.icon} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.4rem' }}>{f.title}</div>
            <div style={{ color: 'var(--muted)', fontSize: '.88rem' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
