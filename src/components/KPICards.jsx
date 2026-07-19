import { useState } from 'react'
import { formatCurrency, formatShortCurrency, getTrendIndicator, getTrendColor } from '../utils/formatters'
import './KPICards.css'

export default function KPICards({ kpis }) {
  const cards = [
    {
      label: 'Patrimonio Total',
      value: formatShortCurrency(kpis.patrimony),
      subtitle: formatCurrency(kpis.patrimony),
      info: 'Suma de todas las cuentas de ahorro e inversión en el último snapshot completo.'
    },
    {
      label: 'CDTs',
      value: formatShortCurrency(kpis.savings),
      subtitle: formatCurrency(kpis.savings),
      info: 'Patrimonio Total menos Inversiones. Dinero disponible sin tocar inversiones.'
    },
    {
      label: 'Inversiones',
      value: formatShortCurrency(kpis.investments),
      subtitle: formatCurrency(kpis.investments),
      info: `Cuentas: ${kpis.investmentAccounts || 'TRI + DOLARES + PROTECCION'}`
    },
    {
      label: 'Meses de Runway',
      value: kpis.runway,
      subtitle: null,
      info: 'Ahorros Disponibles ÷ promedio de gasto mensual. Cuántos meses puedes vivir sin ingresos.'
    },
    {
      label: 'Gasto Este Mes',
      value: formatShortCurrency(kpis.currentMonthExpense),
      subtitle: formatCurrency(kpis.currentMonthExpense),
      change: kpis.expenseChange,
      invertColor: true,
      info: 'Total de gastos del último mes registrado en GASTOS.'
    },
    {
      label: 'Cambio Patrimonial',
      value: `${kpis.patrimonyChange > 0 ? '+' : ''}${kpis.patrimonyChange?.toFixed(1) || 0}%`,
      subtitle: null,
      change: kpis.patrimonyChange,
      info: 'Variación % entre los últimos 2 snapshots de patrimonio.'
    },
    {
      label: 'Tasa de Ahorro',
      value: `${kpis.savingsRate > 0 ? '+' : ''}${kpis.savingsRate?.toFixed(1) || 0}%`,
      subtitle: null,
      change: kpis.savingsRate,
      info: '(Ingresos − Gastos) ÷ Ingresos del mes actual. Qué % de tu ingreso estás ahorrando.'
    },
    {
      label: '% Presupuesto Usado',
      value: `${kpis.budgetUsed?.toFixed(0) || 0}%`,
      subtitle: null,
      change: kpis.budgetUsed > 100 ? kpis.budgetUsed - 100 : undefined,
      invertColor: true,
      info: 'Total gastado del mes ÷ presupuesto total definido en la hoja PRESUPUESTO.'
    },
    {
      label: 'Presupuesto Restante',
      value: formatShortCurrency(kpis.budgetRemaining || 0),
      subtitle: formatCurrency(kpis.budgetRemaining || 0),
      info: 'Presupuesto total menos gastos acumulados del mes actual.'
    },
    {
      label: 'Categorías Excedidas',
      value: `${kpis.categoriesOverBudget || 0} de ${kpis.totalBudgetCategories || 0}`,
      subtitle: null,
      change: kpis.categoriesOverBudget > 0 ? -1 : undefined,
      info: 'Número de categorías donde el gasto superó el presupuesto asignado.'
    }
  ]

  return (
    <div className="kpi-grid">
      {cards.map((card, idx) => {
        const changeVal = card.change
        const hasChange = changeVal !== undefined && changeVal !== 0
        const changeColor = card.invertColor
          ? getTrendColor(-changeVal)
          : getTrendColor(changeVal)

        return (
          <KPICard key={idx} card={card} hasChange={hasChange} changeVal={changeVal} changeColor={changeColor} />
        )
      })}
    </div>
  )
}

function KPICard({ card, hasChange, changeVal, changeColor }) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="kpi-card">
      <button
        className="kpi-info-btn"
        onClick={() => setShowInfo(!showInfo)}
        title={card.info}
      >
        i
      </button>
      <p className="kpi-label">{card.label}</p>
      <p className="kpi-value">{card.value}</p>
      {card.subtitle && <p className="kpi-subtitle">{card.subtitle}</p>}
      {hasChange && (
        <p className="kpi-change" style={{ color: changeColor }}>
          {getTrendIndicator(card.invertColor ? -changeVal : changeVal)} {Math.abs(changeVal).toFixed(1)}% vs mes ant.
        </p>
      )}
      {showInfo && (
        <div className="kpi-info-tooltip">{card.info}</div>
      )}
    </div>
  )
}
