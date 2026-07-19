import './LoadingOverlay.css'

export default function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <p className="loading-text">Cargando datos de Google Sheets...</p>
    </div>
  )
}
