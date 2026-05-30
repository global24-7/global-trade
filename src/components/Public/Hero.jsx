export default function Hero({ onGetStarted, onLogin }) {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      padding: '7rem 4% 4rem', position: 'relative',
      background: `radial-gradient(ellipse at 70% 20%, rgba(201,168,76,0.07), transparent 60%),
                   radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.06), transparent 50%),
                   var(--bg)`,
      overflow: 'hidden'
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070')",
        backgroundSize: 'cover', backgroundPosition: 'center 40%',
        opacity: .12, zIndex: 0
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 680 }}>
        <div className="badge" style={{ marginBottom: '1.5rem' }}>
          <i className="fas fa-chart-line" /> Premium Investment Platform
        </div>
        <h1 style={{ fontSize: 'clamp(2.4rem,5.5vw,4rem)', lineHeight: 1.18, marginBottom: '1rem' }}>
          Grow Your Wealth With <span style={{ color: 'var(--gold2)' }}>Luxury Assets</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', maxWidth: 520, marginBottom: '2rem' }}>
          Invest in world-class luxury vehicles and high-yield plans. Earn up to 270% returns with transparent timelines and daily payouts.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-gold btn-lg" onClick={onGetStarted}>
            <i className="fas fa-rocket" /> Start Investing
          </button>
          <button className="btn btn-ghost btn-lg" onClick={onLogin}>
            <i className="fas fa-sign-in-alt" /> Login
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '3rem' }}>
          {[
            { num: '270%', label: 'Max ROI' },
            { num: '6+',   label: 'Packages' },
            { num: '24/7', label: 'Support' },
            { num: 'GHS',  label: 'Currency' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 700, color: 'var(--gold2)' }}>{s.num}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating cards — hidden on mobile via CSS */}
      <div className="hero-visual" style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', zIndex: 1, display: 'grid', gap: '1rem' }}>
        {[
          { label: 'Rolls-Royce Return', val: 'GHS 1,476', sub: '+270% ROI' },
          { label: 'McLaren Return',     val: 'GHS 480',   sub: '+220% ROI' },
        ].map((c, i) => (
          <div key={i} style={{
            background: 'rgba(17,24,39,0.85)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '1rem 1.4rem', backdropFilter: 'blur(20px)',
            minWidth: 200, marginLeft: i === 1 ? 40 : 0,
            animation: `float 4s ease-in-out ${i === 1 ? '-2s' : '0s'} infinite`
          }}>
            <div style={{ fontSize: '.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: 'var(--gold2)', fontWeight: 700 }}>{c.val}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--green)' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @media(max-width:768px){.hero-visual{display:none!important}}
      `}</style>
    </section>
  )
}
