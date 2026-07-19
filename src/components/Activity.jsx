import { formatDateShort, formatCurrency } from '../utils/formatters'
import './Activity.css'

export default function Activity({ movements }) {
  if (!movements || !Array.isArray(movements) || movements.length === 0) {
    return (
      <div className="activity-container">
        <h3>Actividad Reciente</h3>
        <p className="activity-empty">Sin movimientos registrados</p>
      </div>
    )
  }

  const recentMovements = movements.slice(0, 10)

  return (
    <div className="activity-container">
      <h3>Actividad Reciente</h3>
      <div className="activity-list">
        {recentMovements.map((mov, idx) => {
          if (!mov || !mov.tipo || !mov.monto) return null

          const isDeposit = mov.tipo === 'DEPOSITO'
          const label = mov.etiqueta ? `${mov.banco} - ${mov.etiqueta}` : mov.banco

          return (
            <div key={idx} className="activity-item">
              <div className="activity-left">
                <div className={`activity-icon ${isDeposit ? 'deposit' : 'withdrawal'}`}>
                  {isDeposit ? '↓' : '↑'}
                </div>
                <div className="activity-info">
                  <p className="activity-label">{label}</p>
                  <p className="activity-date">{formatDateShort(mov.fecha) || mov.fecha}</p>
                </div>
              </div>
              <div className={`activity-amount ${isDeposit ? 'positive' : 'negative'}`}>
                {isDeposit ? '+' : '-'}{formatCurrency(mov.monto)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

