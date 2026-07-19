import { useMemo, useState } from 'react'
import { formatCurrency, formatMonth } from '../../utils/formatters'
import AddIncomeModal from '../AddIncomeModal'
import '../tabs/Accounts.css'

const ESTADO_LABEL = {
  pendiente: 'Pendiente de cobro',
  'sin-registro': 'Sin ingreso este mes',
  bajo: 'Por debajo del mínimo',
  normal: 'Dentro del rango',
  alto: 'Por encima del máximo',
  'sin-rango': 'Sin histórico'
}

export default function Accounts({ incomeAnalysis, currentMonth, refreshData }) {
  const [showAddIncome, setShowAddIncome] = useState(false)

  const consultorioOptions = useMemo(() => {
    const names = (incomeAnalysis || []).map(c => c.consultorio).filter(Boolean)
    return Array.from(new Set(names)).sort()
  }, [incomeAnalysis])

  const addIncomeTrigger = (
    <div className="add-expense-trigger-row">
      <button className="add-expense-trigger-btn" onClick={() => setShowAddIncome(true)}>
        + Agregar ingreso
      </button>
    </div>
  )

  const addIncomeModal = showAddIncome && (
    <AddIncomeModal
      onClose={() => setShowAddIncome(false)}
      onSuccess={refreshData}
      consultorioOptions={consultorioOptions}
    />
  )

  if (!incomeAnalysis || !Array.isArray(incomeAnalysis) || incomeAnalysis.length === 0) {
    return (
      <div className="tab-content">
        {addIncomeTrigger}
        <div className="section">
          <h2>Ingresos por Consultorio</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Sin datos de ingresos. Crea las hojas INGRESOS y ANALISIS en tu Google Sheet.
          </p>
        </div>
        {addIncomeModal}
      </div>
    )
  }

  const totalActual = incomeAnalysis.reduce((sum, c) => sum + c.actual, 0)
  const totalPromedio = incomeAnalysis.reduce((sum, c) => sum + c.promedio, 0)
  const pendingCount = incomeAnalysis.filter(c => c.pendiente).length
  const bajoCount = incomeAnalysis.filter(c => c.estado === 'bajo').length

  return (
    <div className="tab-content">
      {addIncomeTrigger}

      <div className="section">
        <div className="section-header">
          <h2>Ingresos por Consultorio {currentMonth ? `- ${formatMonth(currentMonth)}` : ''}</h2>
        </div>

        <div className="income-summary">
          <div className="income-summary-item">
            <span className="income-summary-label">Total del mes</span>
            <span className="income-summary-value">{formatCurrency(totalActual)}</span>
          </div>
          <div className="income-summary-item">
            <span className="income-summary-label">Promedio histórico</span>
            <span className="income-summary-value">{formatCurrency(totalPromedio)}</span>
          </div>
          {pendingCount > 0 && (
            <div className="income-summary-item">
              <span className="income-summary-label">Pendientes de cobro</span>
              <span className="income-summary-value" style={{ color: 'var(--color-warning)' }}>{pendingCount}</span>
            </div>
          )}
          {bajoCount > 0 && (
            <div className="income-summary-item">
              <span className="income-summary-label">Bajo el mínimo histórico</span>
              <span className="income-summary-value" style={{ color: 'var(--color-danger)' }}>{bajoCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="income-rows">
          {incomeAnalysis.map(c => (
            <IncomeRow key={c.consultorio} data={c} />
          ))}
        </div>
      </div>

      {addIncomeModal}
    </div>
  )
}

function IncomeRow({ data }) {
  const { lugar, consultorio, minimo, promedio, maximo, actual, hasRange, estado } = data

  const rowMax = Math.max(maximo, actual, minimo, 1) * 1.1
  const minPct = hasRange ? (minimo / rowMax) * 100 : 0
  const maxPct = hasRange ? (maximo / rowMax) * 100 : 0
  const avgPct = hasRange ? (promedio / rowMax) * 100 : 0
  const actualPct = (actual / rowMax) * 100

  return (
    <div className="income-row">
      <div className="income-row-header">
        <span className="income-consultorio">
          {consultorio}
          {lugar && <span className="income-lugar">{lugar}</span>}
        </span>
        <span className={`income-badge income-badge--${estado}`}>{ESTADO_LABEL[estado]}</span>
      </div>

      <div className="income-bar-track">
        {hasRange && (
          <div
            className="income-bar-range"
            style={{ left: `${minPct}%`, width: `${Math.max(maxPct - minPct, 0.5)}%` }}
            title={`Rango histórico: ${formatCurrency(minimo)} – ${formatCurrency(maximo)}`}
          />
        )}
        {hasRange && (
          <div className="income-bar-avg" style={{ left: `${avgPct}%` }} title={`Promedio: ${formatCurrency(promedio)}`} />
        )}
        <div
          className={`income-bar-actual income-bar-actual--${estado}`}
          style={{ width: `${Math.min(actualPct, 100)}%` }}
        />
      </div>

      <div className="income-row-values">
        <span className="income-row-actual">{data.pendiente && actual === 0 ? 'Pendiente' : formatCurrency(actual)}</span>
        {hasRange && (
          <span className="income-range-text">
            Rango: {formatCurrency(minimo)} – {formatCurrency(maximo)} (prom. {formatCurrency(promedio)})
          </span>
        )}
      </div>
    </div>
  )
}
