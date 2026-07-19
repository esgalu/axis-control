import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatMonth, formatCurrency, getDefaultMonth } from '../../utils/formatters'
import MonthComparison from './MonthComparison'
import TopExpenses from '../TopExpenses'
import '../tabs/Overview.css'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="pie-tooltip">
      <span className="pie-tooltip-dot" style={{ background: d.color }} />
      <span className="pie-tooltip-name">{d.name}</span>
      <span className="pie-tooltip-value">{formatCurrency(d.value)}</span>
    </div>
  )
}

export default function Overview({ expenses, topExpenses, currentMonth }) {
  const availableMonths = (expenses.monthly?.map(m => m.month) || []).sort()
  const [selectedMonth, setSelectedMonth] = useState(() => getDefaultMonth(availableMonths, currentMonth))

  const pieChartData = selectedMonth && expenses.categoriesByMonth?.[selectedMonth]
    ? expenses.categoriesByMonth[selectedMonth]
    : expenses.categories

  const pieTitle = selectedMonth
    ? `Gastos por Categoría — ${formatMonth(selectedMonth)}`
    : 'Gastos por Categoría (Total)'

  return (
    <div className="tab-content">
      <div className="section">
        <div className="section-header">
          <h2>{pieTitle}</h2>
          <div className="month-selector">
            <button
              className={`month-btn ${!selectedMonth ? 'active' : ''}`}
              onClick={() => setSelectedMonth(null)}
            >
              Todos
            </button>
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

        <div className="pie-layout">
          <div className="pie-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={130}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pie-legend">
            {pieChartData.map((entry, idx) => (
              <div key={idx} className="pie-legend-item">
                <div className="pie-legend-header">
                  <span className="pie-legend-dot" style={{ background: entry.color }} />
                  <span className="pie-legend-name">{entry.name}</span>
                  <span className="pie-legend-pct">{entry.pct}%</span>
                </div>
                <div className="pie-legend-bar-track">
                  <div
                    className="pie-legend-bar-fill"
                    style={{ width: `${Math.min(entry.pct, 100)}%`, background: entry.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {expenses.categoriesByMonth && Object.keys(expenses.categoriesByMonth).length >= 2 && (
        <MonthComparison expenses={expenses} currentMonth={currentMonth} />
      )}

      <TopExpenses topExpenses={topExpenses} />
    </div>
  )
}
