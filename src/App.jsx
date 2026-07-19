import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './context/AuthContext'
import KPICards from './components/KPICards'
import NavTabs from './components/NavTabs'
import Overview from './components/tabs/Overview'
import Trends from './components/tabs/Trends'
import CashFlow from './components/tabs/CashFlow'
import Budget from './components/tabs/Budget'
import Accounts from './components/tabs/Accounts'
import AuthStatus from './components/AuthStatus'
import LoadingOverlay from './components/LoadingOverlay'
import ErrorBanner from './components/ErrorBanner'
import IPhoneFrame from './components/IPhoneFrame'
import MobileDashboard from './components/MobileDashboard'
import AddExpenseModal from './components/AddExpenseModal'
import { useDashboardData } from './hooks/useDashboardData'
import { useAutoTheme } from './hooks/useAutoTheme'
import './styles/App.css'

function App() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [mobilePreview, setMobilePreview] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)

  useAutoTheme()

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const { kpis, expenses, trend, projectedTrend, cashFlow, topExpenses, budgetData, accounts, movements, accountTimeSeries, incomeAnalysis, currentMonth, monthlyIncome, incomeStats, projectedIncomeTrend, isLoading, error, dataSource, refreshData } = useDashboardData()

  const clasificacionOptions = useMemo(() => (expenses?.categories?.map(c => c.name) || []).sort(), [expenses])

  const categoriasByClasificacion = useMemo(() => {
    const sets = {}
    if (expenses?.detail) {
      Object.values(expenses.detail).forEach(monthData => {
        Object.entries(monthData).forEach(([clasificacion, items]) => {
          if (!sets[clasificacion]) sets[clasificacion] = new Set()
          items.forEach(item => sets[clasificacion].add(item.name))
        })
      })
    }
    const result = {}
    Object.entries(sets).forEach(([k, set]) => { result[k] = Array.from(set).sort() })
    return result
  }, [expenses])

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="login-screen">
          <div className="login-loading"><span className="auth-loading-dot" /></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="login-screen">
          <div className="login-card">
            <img src="/assets/logos/axis-isotipo.svg" alt="AXIS" className="login-logo" />
            <h1 className="login-title">AXIS</h1>
            <p className="login-subtitle">Dashboard Finanzas Personales</p>
            <p className="login-desc">Conecta tu cuenta de Google para acceder al dashboard y visualizar tus datos financieros.</p>
            <button className="login-btn" onClick={login}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Conectar con Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isMobile && kpis) {
    return (
      <div className="mobile-app-root">
        <MobileDashboard
          kpis={kpis}
          expenses={expenses}
          trend={trend}
          projectedTrend={projectedTrend}
          cashFlow={cashFlow}
          topExpenses={topExpenses}
          budgetData={budgetData}
          accounts={accounts}
          accountTimeSeries={accountTimeSeries}
          incomeAnalysis={incomeAnalysis}
          currentMonth={currentMonth}
          monthlyIncome={monthlyIncome}
          incomeStats={incomeStats}
          projectedIncomeTrend={projectedIncomeTrend}
          clasificacionOptions={clasificacionOptions}
          categoriasByClasificacion={categoriasByClasificacion}
          refreshData={refreshData}
          isLoading={isLoading}
        />
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <div className="header-brand">
              <img src="/assets/logos/axis-isotipo.svg" alt="AXIS" className="header-logo" />
              <h1>AXIS</h1>
            </div>
            <p className="header-subtitle">Conectado a Google Sheets</p>
          </div>
          <div className="header-actions">
            <button className="mobile-preview-btn" onClick={() => setMobilePreview(true)} title="Vista iPhone 16">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="3"/>
                <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none"/>
              </svg>
              Vista móvil
            </button>
            <AuthStatus />
          </div>
        </div>
      </header>

      <main className="app-main">
        {isLoading && <LoadingOverlay />}
        {error && <ErrorBanner message={error} onRetry={refreshData} />}

        {kpis && (
          <>
            <KPICards kpis={kpis} />
            <div className="add-expense-trigger-row">
              <button className="add-expense-trigger-btn" onClick={() => setShowAddExpense(true)}>
                + Agregar gasto
              </button>
            </div>
            <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="tab-container">
              {activeTab === 'overview' && <Overview expenses={expenses} topExpenses={topExpenses} currentMonth={currentMonth} />}
              {activeTab === 'budget' && <Budget budgetData={budgetData} kpis={kpis} expenses={expenses} currentMonth={currentMonth} />}
              {activeTab === 'cashflow' && <CashFlow cashFlow={cashFlow} totalBudget={budgetData?.reduce((sum, b) => sum + b.presupuesto, 0) || 0} />}
              {activeTab === 'accounts' && <Accounts incomeAnalysis={incomeAnalysis} currentMonth={currentMonth} refreshData={refreshData} />}
              {activeTab === 'trends' && <Trends trend={trend} projectedTrend={projectedTrend} accounts={accounts} monthlyIncome={monthlyIncome} incomeStats={incomeStats} projectedIncomeTrend={projectedIncomeTrend} />}
            </div>
          </>
        )}

        <footer className="app-footer">
          <p>Datos cargados desde Google Sheets</p>
          <button className="refresh-btn" onClick={refreshData}>Actualizar datos</button>
        </footer>
      </main>

      {mobilePreview && (
        <IPhoneFrame onExit={() => setMobilePreview(false)}>
          <MobileDashboard
            kpis={kpis}
            expenses={expenses}
            trend={trend}
            projectedTrend={projectedTrend}
            cashFlow={cashFlow}
            topExpenses={topExpenses}
            budgetData={budgetData}
            accounts={accounts}
            accountTimeSeries={accountTimeSeries}
            incomeAnalysis={incomeAnalysis}
            currentMonth={currentMonth}
            monthlyIncome={monthlyIncome}
            incomeStats={incomeStats}
            projectedIncomeTrend={projectedIncomeTrend}
            clasificacionOptions={clasificacionOptions}
            categoriasByClasificacion={categoriasByClasificacion}
            refreshData={refreshData}
            isLoading={isLoading}
          />
        </IPhoneFrame>
      )}

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

export default App
