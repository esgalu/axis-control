import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency, formatShortCurrency, formatMonth } from '../../utils/formatters'
import './Budget.css'

function getStatusColor(estado) {
  if (estado === 'rojo') return 'var(--color-danger)'
  if (estado === 'amarillo') return 'var(--color-warning)'
  return 'var(--color-success)'
}

export default function Budget({ budgetData, kpis, expenses }) {
  if (!budgetData || budgetData.length === 0) {
    return (
      <div className="tab-content">
        <div className="section">
          <h2>Presupuesto</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Sin datos de presupuesto. Crea la hoja PRESUPUESTO en tu Google Sheet.
          </p>
        </div>
      </div>
    )
  }

  const availableMonths = expenses?.monthly?.map(m => m.month).sort() || []
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1])

  const monthBudget = useMemo(() => {
    const expensesByCat = {}
    if (selectedMonth && expenses?.categoriesByMonth?.[selectedMonth]) {
      const cats = expenses.categoriesByMonth[selectedMonth]
      if (Array.isArray(cats)) {
        cats.forEach(c => { expensesByCat[c.name] = c.value })
      }
    }

    return budgetData.map(b => {
      const gastado = expensesByCat[b.categoria] || 0
      const porcentaje = b.presupuesto > 0 ? (gastado / b.presupuesto) * 100 : 0
      const estado = porcentaje > 100 ? 'rojo' : porcentaje > 80 ? 'amarillo' : 'verde'
      return { ...b, gastado, porcentaje, estado }
    })
  }, [selectedMonth, budgetData, expenses])

  const sortedByBudget = [...monthBudget].sort((a, b) => b.presupuesto - a.presupuesto)

  const totalBudget = sortedByBudget.reduce((sum, b) => sum + b.presupuesto, 0)
  const totalSpent = sortedByBudget.reduce((sum, b) => sum + b.gastado, 0)
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const overallColor = overallPct > 100 ? 'var(--color-danger)' : overallPct > 80 ? 'var(--color-warning)' : 'var(--color-success)'

  const isCurrentMonth = selectedMonth === availableMonths[availableMonths.length - 1]
  const projectedMonthEnd = useMemo(() => {
    if (!selectedMonth) return 0
    if (isCurrentMonth) {
      const now = new Date()
      const dayOfMonth = now.getDate()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      return dayOfMonth > 0 ? Math.round((totalSpent / dayOfMonth) * daysInMonth) : 0
    }
    return totalSpent
  }, [selectedMonth, totalSpent, isCurrentMonth])

  const dailyBudgetRemaining = useMemo(() => {
    if (!selectedMonth) return 0
    if (isCurrentMonth) {
      const now = new Date()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const daysRemaining = daysInMonth - now.getDate()
      return daysRemaining > 0 ? Math.round((totalBudget - totalSpent) / daysRemaining) : 0
    }
    return 0
  }, [selectedMonth, totalBudget, totalSpent, isCurrentMonth])

  const chartData = sortedByBudget.map(b => ({
    name: b.categoria,
    Presupuesto: b.presupuesto,
    Gastado: b.gastado
  }))

  return (
    <div className="tab-content">
      <div className="section">
        <div className="section-header">
          <h2>Presupuesto {selectedMonth ? `- ${formatMonth(selectedMonth)}` : ''}</h2>
          <div className="month-selector">
            {availableMonths.map(month => (
              <button
                key={month}
                className={`month-btn ${selectedMonth === month ? 'active' : ''}`}
                onClick={() => setSelectedMonth(month)}
              >
                {formatMonth(month)}
              </button>
            ))}
          </div>
        </div>

        <div className="budget-overview">
          <div className="budget-overview-bar">
            <div className="budget-bar-track">
              <div
                className="budget-bar-fill"
                style={{ width: `${Math.min(overallPct, 100)}%`, background: overallColor }}
              />
            </div>
            <div className="budget-overview-text">
              <span>{formatCurrency(totalSpent)} de {formatCurrency(totalBudget)}</span>
              <span className="budget-overview-pct" style={{ color: overallColor }}>
                {overallPct.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="budget-overview-meta">
            {isCurrentMonth ? (
              <>
                <BudgetMetaItem
                  label="Proyección fin de mes"
                  info="(Gasto acumulado ÷ días transcurridos) × días del mes. Estima cuánto gastarás si mantienes el ritmo actual."
                  value={formatCurrency(projectedMonthEnd)}
                  color={projectedMonthEnd > totalBudget ? 'var(--color-danger)' : 'var(--color-success)'}
                />
                <BudgetMetaItem
                  label="Disponible por día"
                  info="(Presupuesto total − gasto acumulado) ÷ días restantes del mes. Cuánto puedes gastar por día sin exceder el presupuesto."
                  value={formatCurrency(dailyBudgetRemaining)}
                  color={dailyBudgetRemaining < 0 ? 'var(--color-danger)' : 'var(--text-primary)'}
                />
              </>
            ) : (
              <>
                <div className="budget-meta-item">
                  <span className="budget-meta-label">Resultado del mes</span>
                  <span className="budget-meta-value" style={{ color: totalSpent > totalBudget ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {totalSpent > totalBudget ? 'Excedido por ' : 'Ahorraste '}
                    {formatCurrency(Math.abs(totalBudget - totalSpent))}
                  </span>
                </div>
                <div className="budget-meta-item">
                  <span className="budget-meta-label">Gasto total</span>
                  <span className="budget-meta-value">{formatCurrency(totalSpent)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Por Categoría</h2>
        <div className="budget-categories">
          {sortedByBudget.map((b, idx) => (
            <div key={idx} className="budget-category">
              <div className="budget-cat-header">
                <span className="budget-cat-name">{b.categoria}</span>
              </div>
              <div className="budget-cat-bar-track">
                <div
                  className="budget-cat-bar-fill"
                  style={{
                    width: `${Math.min(b.porcentaje, 100)}%`,
                    background: getStatusColor(b.estado)
                  }}
                />
                {b.porcentaje > 100 && (
                  <div
                    className="budget-cat-bar-over"
                    style={{ width: `${Math.min(b.porcentaje - 100, 100)}%` }}
                  />
                )}
              </div>
              <div className="budget-cat-values">
                <span>{formatCurrency(b.gastado)} / {formatCurrency(b.presupuesto)}</span>
                <span className="budget-cat-pct" style={{ color: getStatusColor(b.estado) }}>
                  {b.porcentaje.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section section--budget-chart">
        <h2>Presupuesto vs Real</h2>
        <div className="chart-container" style={{ height: Math.max(400, sortedByBudget.length * 40 + 60) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatShortCurrency} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Presupuesto" fill="var(--border-color)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Gastado" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.Gastado > entry.Presupuesto ? 'var(--color-danger)' : 'var(--color-primary)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function BudgetMetaItem({ label, info, value, color }) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="budget-meta-item">
      <span className="budget-meta-label">
        {label}
        <span className="budget-meta-info" onClick={() => setShowInfo(!showInfo)}>i</span>
      </span>
      <span className="budget-meta-value" style={{ color }}>{value}</span>
      {showInfo && <span className="budget-meta-tooltip">{info}</span>}
    </div>
  )
}
