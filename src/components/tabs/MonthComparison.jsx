import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatMonth, formatCurrency, formatShortCurrency, calculateChange, getDefaultMonth } from '../../utils/formatters'
import './MonthComparison.css'

export default function MonthComparison({ expenses, currentMonth }) {
  const months = Object.keys(expenses.categoriesByMonth).sort()
  const [monthB, setMonthB] = useState(() => getDefaultMonth(months, currentMonth))
  const [monthA, setMonthA] = useState(() => {
    const idxB = months.indexOf(getDefaultMonth(months, currentMonth))
    return idxB > 0 ? months[idxB - 1] : months[months.length - 2]
  })
  const [expanded, setExpanded] = useState({})

  const detail = expenses.detail || {}

  const categoriesA = expenses.categoriesByMonth[monthA] || []
  const categoriesB = expenses.categoriesByMonth[monthB] || []

  const allCategories = new Set([
    ...categoriesA.map(c => c.name),
    ...categoriesB.map(c => c.name)
  ])

  const comparisonData = Array.from(allCategories).map(name => {
    const a = categoriesA.find(c => c.name === name)
    const b = categoriesB.find(c => c.name === name)
    const valA = a?.value || 0
    const valB = b?.value || 0
    const change = calculateChange(valB, valA)

    const detailA = detail[monthA]?.[name] || []
    const detailB = detail[monthB]?.[name] || []
    const allSubs = new Set([...detailA.map(d => d.name), ...detailB.map(d => d.name)])
    const subcategories = Array.from(allSubs).map(sub => {
      const subA = detailA.find(d => d.name === sub)?.value || 0
      const subB = detailB.find(d => d.name === sub)?.value || 0
      return { name: sub, valA: subA, valB: subB, change: calculateChange(subB, subA) }
    }).sort((a, b) => Math.max(b.valA, b.valB) - Math.max(a.valA, a.valB))

    return { name, valA, valB, diff: valB - valA, change, subcategories }
  }).sort((a, b) => Math.max(b.valA, b.valB) - Math.max(a.valA, a.valB))

  const totalA = comparisonData.reduce((sum, c) => sum + c.valA, 0)
  const totalB = comparisonData.reduce((sum, c) => sum + c.valB, 0)
  const totalChange = calculateChange(totalB, totalA)

  const chartData = [...comparisonData]
    .sort((a, b) => Math.max(b.valA, b.valB) - Math.max(a.valA, a.valB))
    .map(c => ({
      name: c.name,
      [formatMonth(monthA)]: c.valA,
      [formatMonth(monthB)]: c.valB
    }))

  const toggleExpand = (name) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <div className="section section--comparison">
      <div className="section-header">
        <h2>Comparativo Mensual</h2>
      </div>

      <div className="comparison-selectors">
        <select value={monthA} onChange={e => setMonthA(e.target.value)}>
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <span className="comparison-vs">vs</span>
        <select value={monthB} onChange={e => setMonthB(e.target.value)}>
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
      </div>

      <div className="comparison-summary" style={{ color: totalChange > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
        {totalChange > 0 ? '↑' : '↓'} Gastaste {Math.abs(totalChange).toFixed(1)}%
        {totalChange > 0 ? ' más' : ' menos'} en {formatMonth(monthB)} vs {formatMonth(monthA)}
      </div>

      <div className="chart-container tall">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11, angle: -35, textAnchor: 'end' }} interval={0} height={70} />
            <YAxis tickFormatter={formatShortCurrency} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey={formatMonth(monthA)} fill="#85B7EB" radius={[4, 4, 0, 0]} />
            <Bar dataKey={formatMonth(monthB)} fill="#185FA5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="comparison-table">
        <div className="comparison-row comparison-header">
          <span className="comp-name">Categoría</span>
          <span className="comp-val">{formatMonth(monthA)}</span>
          <span className="comp-val">{formatMonth(monthB)}</span>
          <span className="comp-change">Cambio</span>
        </div>
        {comparisonData.map(c => (
          <div key={c.name}>
            <div
              className={`comparison-row comparison-expandable ${expanded[c.name] ? 'expanded' : ''}`}
              onClick={() => toggleExpand(c.name)}
            >
              <span className="comp-name">
                <span className="comp-arrow">{expanded[c.name] ? '▼' : '▶'}</span>
                {c.name}
              </span>
              <span className="comp-val">{formatCurrency(c.valA)}</span>
              <span className="comp-val">{formatCurrency(c.valB)}</span>
              <span className="comp-change" style={{ color: c.change > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {c.change > 0 ? '↑' : '↓'} {Math.abs(c.change).toFixed(1)}%
              </span>
            </div>
            {expanded[c.name] && c.subcategories.map(sub => (
              <div key={sub.name} className="comparison-row comparison-subrow">
                <span className="comp-name comp-subname">{sub.name}</span>
                <span className="comp-val comp-subval">{sub.valA > 0 ? formatCurrency(sub.valA) : '—'}</span>
                <span className="comp-val comp-subval">{sub.valB > 0 ? formatCurrency(sub.valB) : '—'}</span>
                <span className="comp-change comp-subval" style={{ color: sub.change > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {sub.valA > 0 && sub.valB > 0 ? `${sub.change > 0 ? '↑' : '↓'} ${Math.abs(sub.change).toFixed(0)}%` : sub.valB > 0 ? 'Nuevo' : '—'}
                </span>
              </div>
            ))}
          </div>
        ))}
        <div className="comparison-row comparison-total">
          <span className="comp-name">TOTAL</span>
          <span className="comp-val">{formatCurrency(totalA)}</span>
          <span className="comp-val">{formatCurrency(totalB)}</span>
          <span className="comp-change" style={{ color: totalChange > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {totalChange > 0 ? '↑' : '↓'} {Math.abs(totalChange).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}
