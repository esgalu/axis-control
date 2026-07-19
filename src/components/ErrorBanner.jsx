import { useState } from 'react'
import './ErrorBanner.css'

export default function ErrorBanner({ message, onRetry }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !message) return null

  return (
    <div className="error-banner">
      <span className="error-message">{message}</span>
      <div className="error-actions">
        {onRetry && (
          <button className="error-btn error-btn-retry" onClick={onRetry}>
            Reintentar
          </button>
        )}
        <button className="error-btn error-btn-dismiss" onClick={() => setDismissed(true)}>
          &times;
        </button>
      </div>
    </div>
  )
}
