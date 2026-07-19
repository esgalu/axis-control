// Formato de moneda COP
export function formatCurrency(value, showDecimals = false) {
  if (!value && value !== 0) return '$0'
  const num = Number(value)
  if (isNaN(num)) return '$0'

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: showDecimals ? 0 : 0,
    minimumFractionDigits: 0
  }).format(num)
}

// Formato abreviado para gráficos (M, K)
export function formatShortCurrency(value) {
  if (!value && value !== 0) return '$0'
  const num = Number(value)
  if (isNaN(num)) return '$0'

  if (Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`
  }
  if (Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`
  }
  return `$${num}`
}

// Formato de fecha corta
export function formatDateShort(dateStr) {
  if (!dateStr) return ''

  try {
    // Si viene como numero serial de Excel (ej: 46204)
    if (typeof dateStr === 'number' && dateStr > 40000 && dateStr < 60000) {
      const d = new Date((dateStr - 25569) * 86400000)
      return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(d).replace('.', '')
    }

    // Si viene como "2026-06-22"
    let date
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      } else {
        return dateStr.slice(0, 10)
      }
    } else {
      date = new Date(dateStr)
    }

    if (isNaN(date.getTime())) {
      return String(dateStr).slice(0, 10)
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short'
    }).format(date).replace('.', '')
  } catch (e) {
    return String(dateStr).slice(0, 10)
  }
}

// Formato de fecha completa
export function formatDateFull(dateStr) {
  if (!dateStr) return ''

  try {
    const date = new Date(dateStr + 'T00:00:00')
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch (e) {
    return String(dateStr)
  }
}

// Formato de mes (Mayo 2026)
export function formatMonth(monthStr) {
  if (!monthStr) return ''

  try {
    const [year, month] = monthStr.split('-')
    const date = new Date(year, parseInt(month) - 1)
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long'
    }).format(date)
  } catch (e) {
    return String(monthStr)
  }
}

// Calcular % de cambio
export function calculateChange(current, previous) {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous) * 100
}

// Formato de % con color
export function formatPercent(value, decimals = 1) {
  if (typeof value !== 'number' || isNaN(value)) return '0%'
  return `${value.toFixed(decimals)}%`
}

// Indicador visual de tendencia
export function getTrendIndicator(value) {
  if (value > 0) return '↑'
  if (value < 0) return '↓'
  return '→'
}

// Color de tendencia
export function getTrendColor(value) {
  if (value > 0) return 'var(--color-success)'
  if (value < 0) return 'var(--color-danger)'
  return 'var(--text-muted)'
}
