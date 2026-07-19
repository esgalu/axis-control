import { useMemo } from 'react'

export function useTimeSeriesData(rawData) {
  return useMemo(() => {
    if (!rawData) return { accountHistory: {}, trendData: [] }

    const snapshots = Array.isArray(rawData.trend) ? rawData.trend : []

    // Agrupar snapshots por cuenta
    const accountHistory = {}
    snapshots.forEach(snap => {
      // Si viene de SNAPSHOTS (v1.1): { fecha, banco, etiqueta, saldo }
      if (snap.fecha && snap.banco) {
        const accountName = snap.etiqueta
          ? `${snap.banco} - ${snap.etiqueta}`
          : snap.banco

        if (!accountHistory[accountName]) {
          accountHistory[accountName] = []
        }

        accountHistory[accountName].push({
          date: snap.fecha,
          saldo: snap.saldo,
          total: snap.total
        })
      }
    })

    // Ordenar cronológicamente
    Object.keys(accountHistory).forEach(account => {
      accountHistory[account].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      )
    })

    // Preparar datos para trend (si vienen en formato { date, total })
    const trendData = snapshots
      .filter(s => s.date && s.total)
      .map(s => ({
        date: s.date,
        total: s.total
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    return {
      accountHistory,
      trendData,
      accountNames: Object.keys(accountHistory).sort()
    }
  }, [rawData])
}
