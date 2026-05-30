import { useApp } from '../../context/AppContext.jsx'

export default function Toast() {
  const { toastState } = useApp()
  const { msg, type, show } = toastState

  const icon = type === 'error'
    ? 'fas fa-times-circle text-red'
    : type === 'success'
    ? 'fas fa-check-circle text-green'
    : 'fas fa-info-circle text-gold'

  return (
    <div className={`toast ${show ? 'show' : ''} ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`}>
      <i className={icon} />
      <span>{msg}</span>
    </div>
  )
}
