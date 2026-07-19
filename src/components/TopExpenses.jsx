import { formatCurrency } from '../utils/formatters'
import './TopExpenses.css'

export default function TopExpenses({ topExpenses }) {
  if (!topExpenses || topExpenses.length === 0) return null

  return (
    <div className="top-expenses-container">
      <h3>Top Gastos del Mes</h3>
      <div className="top-expenses-list">
        {topExpenses.map((exp, idx) => (
          <div key={idx} className="top-expense-item">
            <div className="top-expense-rank">{idx + 1}</div>
            <div className="top-expense-info">
              <p className="top-expense-name">{exp.categoria}</p>
              <span className="top-expense-badge">{exp.clasificacion}</span>
            </div>
            <div className="top-expense-amount">{formatCurrency(exp.costo)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
