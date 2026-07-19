import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { formatMonth, formatCurrency, formatShortCurrency } from '../../utils/formatters'
import './CashFlow.css'

export default function CashFlow({ cashFlow, totalBudget }) {
  if (!cashFlow || cashFlow.length === 0) {
    return (
      <div className="tab-content">
        <div className="section">
          <h2>Flujo de Caja</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tab-content">
      <div className="section">
        <h2>Flujo de Caja</h2>
        <div className="chart-container tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlow} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} />
              <YAxis tickFormatter={formatShortCurrency} />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(value),
                  name === 'income' ? 'Ingresos' : 'Gastos'
                ]}
                labelFormatter={formatMonth}
              />
              <Legend formatter={(value) => value === 'income' ? 'Ingresos' : 'Gastos'} />
              {totalBudget > 0 && (
                <ReferenceLine
                  y={totalBudget}
                  stroke="var(--color-warning)"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  label={{
                    value: `Presupuesto ${formatShortCurrency(totalBudget)}`,
                    position: 'right',
                    fill: 'var(--color-warning)',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                />
              )}
              <Bar dataKey="income" fill="var(--color-success)" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="income" position="top" formatter={formatShortCurrency} style={{ fontSize: 10, fill: 'var(--color-success)' }} />
              </Bar>
              <Bar dataKey="expenses" fill="var(--color-danger)" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="expenses" position="top" formatter={formatShortCurrency} style={{ fontSize: 10, fill: 'var(--color-danger)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="cashflow-summary">
          {cashFlow.map(cf => {
            const balance = cf.income - cf.expenses
            const isPositive = balance >= 0
            return (
              <div key={cf.month} className="cashflow-month">
                <span className="cashflow-month-name">{formatMonth(cf.month)}</span>
                <span className="cashflow-balance" style={{ color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {isPositive ? '+' : ''}{formatCurrency(balance)}
                </span>
                <span className="cashflow-label">{isPositive ? 'Ahorraste' : 'Déficit'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
