import { useMemo } from 'react'
import { calculateChange } from '../utils/formatters'

export function useIndicators(rawData) {
  return useMemo(() => {
    if (!rawData) return null

    const trend = rawData.trend || []
    const expenses = rawData.monthlyExpense || []
    const movements = Array.isArray(rawData.movements) ? rawData.movements : []

    // ========== PATRIMONIO ==========
    const currentPatrimony = rawData.savings
      ? Object.values(rawData.savings).reduce((a, b) => a + b, 0)
      : 0

    const firstSnapshot = trend.length > 0 ? trend[0]?.total : currentPatrimony
    const patrimonySprint = calculateChange(currentPatrimony, firstSnapshot)

    const patrimonysSpeed = (() => {
      if (trend.length < 2) return 0
      const firstDate = new Date(trend[0].date)
      const lastDate = new Date(trend[trend.length - 1].date)
      const days = (lastDate - firstDate) / (1000 * 60 * 60 * 24)
      const weeks = Math.max(days / 7, 1)
      return (currentPatrimony - firstSnapshot) / weeks
    })()

    // ========== GASTOS ==========
    let totalExpenses = 0
    let topCategory = { name: '', value: 0 }
    let expensesDaysCount = 30

    if (rawData.expenses && rawData.expenses.length > 0) {
      totalExpenses = rawData.expenses.reduce((sum, exp) => sum + exp.value, 0)
      topCategory = rawData.expenses[0] || { name: '', value: 0 }
    }

    if (expenses.length > 0) {
      const dates = expenses.map(e => new Date(e.month + '-01'))
      const start = new Date(Math.min(...dates))
      const end = new Date(Math.max(...dates))
      expensesDaysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 30
    }

    const avgDailyExpense = expensesDaysCount > 0 ? totalExpenses / expensesDaysCount : 0

    let expensesVariation = 0
    if (expenses.length >= 2) {
      const prev = expenses[expenses.length - 2]?.total || 0
      const curr = expenses[expenses.length - 1]?.total || 0
      expensesVariation = calculateChange(curr, prev)
    }

    // ========== MOVIMIENTOS ==========
    let totalInflows = 0
    let totalOutflows = 0
    let topAccount = { banco: '', count: 0 }

    movements.forEach(mov => {
      if (mov.tipo === 'DEPOSITO') {
        totalInflows += mov.monto || 0
      } else if (mov.tipo === 'RETIRO') {
        totalOutflows += mov.monto || 0
      }
    })

    // Cuenta más activa
    const accountCounts = {}
    movements.forEach(mov => {
      const key = mov.banco || 'Unknown'
      accountCounts[key] = (accountCounts[key] || 0) + 1
    })

    topAccount = Object.entries(accountCounts).reduce((max, [banco, count]) => {
      return count > max.count ? { banco, count } : max
    }, { banco: '', count: 0 })

    const netFlow = totalInflows - totalOutflows

    // ========== PROYECCIONES ==========
    const yearlyGrowth = patrimonysSpeed * 52

    return {
      patrimony: {
        current: currentPatrimony,
        changePercent: patrimonySprint,
        velocity: patrimonysSpeed,
        trendDirection: patrimonySprint > 0 ? '↑' : '↓'
      },
      expenses: {
        total: totalExpenses,
        avgDaily: avgDailyExpense,
        topCategory: topCategory.name,
        monthVariation: expensesVariation
      },
      movements: {
        inflows: totalInflows,
        outflows: totalOutflows,
        netFlow: netFlow,
        topAccount: topAccount.banco
      },
      projections: {
        yearlyGrowth: yearlyGrowth,
        burnRate: avgDailyExpense
      }
    }
  }, [rawData])
}
