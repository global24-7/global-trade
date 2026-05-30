import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Navbar from './components/Layout/Navbar.jsx'
import Footer from './components/Layout/Footer.jsx'
import PublicPage from './components/Public/PublicPage.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import Toast from './components/UI/Toast.jsx'
import Loader from './components/UI/Loader.jsx'

function AppRoutes() {
  const { user, loading } = useApp()

  if (loading) return <Loader message="Initializing platform..." />

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <PublicPage />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!user && <Footer />}
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
