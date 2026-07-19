import { useState } from 'react'
import KPICards from './KPICards'
import Overview from './tabs/Overview'
import Budget from './tabs/Budget'
import CashFlow from './tabs/CashFlow'
import Accounts from './tabs/Accounts'
import Trends from './tabs/Trends'
import MobileBottomNav from './MobileBottomNav'
import AddExpenseModal from './AddExpenseModal'
import './MobileDashboard.css'

const TAB_TITLES = {
  overview: 'Visión General',
  budget: 'Presupuesto',
  cashflow: 'Flujo de Caja',
  accounts: 'Ingresos',
  trends: 'Tendencias',
}

export default function MobileDashboard({ kpis, expenses, trend, projectedTrend, cashFlow, topExpenses, budgetData, accounts, accountTimeSeries, incomeAnalysis, currentMonth, monthlyIncome, incomeStats, projectedIncomeTrend, clasificacionOptions, categoriasByClasificacion, refreshData, isLoading }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const totalBudget = budgetData?.reduce((sum, b) => sum + b.presupuesto, 0) || 0

  return (
    <div className="mobile-dashboard">
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <img src="/assets/logos/axis-isotipo.svg" alt="AXIS" className="mobile-header-logo" />
          <span className="mobile-header-name">AXIS</span>
        </div>
        <div className="mobile-header-right">
          <span className="mobile-header-title">{TAB_TITLES[activeTab]}</span>
          <button
            className={`mobile-refresh-btn ${isLoading ? 'spinning' : ''}`}
            onClick={refreshData}
            disabled={isLoading}
            aria-label="Actualizar datos"
            title="Actualizar datos"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
              <path d="M21 4v5h-5"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="mobile-content">
        {activeTab === 'overview' && (
          <>
            {kpis && <KPICards kpis={kpis} />}
            <button className="mobile-add-expense-btn" onClick={() => setShowAddExpense(true)}>
              + Agregar gasto
            </button>
            <Overview expenses={expenses} topExpenses={topExpenses} currentMonth={currentMonth} />
          </>
        )}
        {activeTab === 'budget' && <Budget budgetData={budgetData} kpis={kpis} expenses={expenses} currentMonth={currentMonth} />}
        {activeTab === 'cashflow' && <CashFlow cashFlow={cashFlow} totalBudget={totalBudget} />}
        {activeTab === 'accounts' && <Accounts incomeAnalysis={incomeAnalysis} currentMonth={currentMonth} refreshData={refreshData} />}
        {activeTab === 'trends' && <Trends trend={trend} projectedTrend={projectedTrend} accounts={accounts} monthlyIncome={monthlyIncome} incomeStats={incomeStats} projectedIncomeTrend={projectedIncomeTrend} mobileMode />}
      </div>

      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSuccess={refreshData}
          clasificacionOptions={clasificacionOptions}
          categoriasByClasificacion={categoriasByClasificacion}
        />
      )}
    </div>
  )
}
