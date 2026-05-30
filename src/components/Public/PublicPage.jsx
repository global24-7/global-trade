import { useState } from 'react'
import Navbar from '../Layout/Navbar.jsx'
import Hero from './Hero.jsx'
import AssetCards from './AssetCards.jsx'
import PlanCards from './PlanCards.jsx'
import Features from './Features.jsx'
import AuthModal from '../Auth/AuthModal.jsx'
import { useApp } from '../../context/AppContext.jsx'

export default function PublicPage() {
  const { packages, plans } = useApp()
  const [authModal, setAuthModal] = useState(null) // 'login' | 'register' | null

  return (
    <>
      <Navbar
        onLogin={() => setAuthModal('login')}
        onRegister={() => setAuthModal('register')}
      />

      <main>
        <Hero onGetStarted={() => setAuthModal('register')} onLogin={() => setAuthModal('login')} />
        <AssetCards packages={packages} onInvest={() => setAuthModal('register')} />
        <PlanCards plans={plans} onInvest={() => setAuthModal('register')} />
        <Features />
      </main>

      {authModal && (
        <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />
      )}
    </>
  )
}
