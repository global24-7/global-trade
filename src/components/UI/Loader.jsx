export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <p>{message}</p>
    </div>
  )
}
