export default function Footer() {
  return (
    <footer style={{
      background: '#030508', borderTop: '1px solid var(--border)',
      padding: '3rem 4% 1.5rem', marginTop: '2rem'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg,var(--gold2),var(--gold))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            Global Trade
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: '.7rem', lineHeight: 1.7 }}>
            A premium investment platform delivering high-yield returns through luxury asset portfolios.
          </p>
        </div>
        <div>
          <p style={{ fontSize: '.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: '1rem' }}>Platform</p>
          <ul style={{ listStyle: 'none' }}>
            {['Investment Packages', 'Investment Plans', 'How It Works', 'Security'].map(item => (
              <li key={item} style={{ marginBottom: '.5rem' }}>
                <a href="#" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '.88rem' }}>{item}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p style={{ fontSize: '.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: '1rem' }}>Support</p>
          <ul style={{ listStyle: 'none' }}>
            {['Contact Us', 'WhatsApp Support', 'FAQs', 'Terms of Service'].map(item => (
              <li key={item} style={{ marginBottom: '.5rem' }}>
                <a href="#" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '.88rem' }}>{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="disclaimer">
          <strong>⚠️ Risk Disclaimer:</strong> Investment involves risk. Past performance does not guarantee future results. The returns shown are projected and not guaranteed. Only invest what you can afford to lose. Global Trade is not regulated by any financial authority.
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-sm text-muted">© {new Date().getFullYear()} Global Trade Investment</p>
          <p className="text-xs text-muted mt-1">All rights reserved</p>
        </div>
      </div>
    </footer>
  )
}
