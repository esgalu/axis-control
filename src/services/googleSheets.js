import axios from 'axios'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

function serialToDate(val) {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10)
  const num = Number(val)
  if (isNaN(num) || num < 40000 || num > 60000) return null
  const date = new Date((num - 25569) * 86400000)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getVal(row, idx) {
  if (!row || idx >= row.length) return 0
  const v = row[idx]
  if (typeof v === 'number') return v
  if (!v) return 0
  const cleaned = String(v).replace(/[$,\s]/g, '')
  const num = Number(cleaned)
  return isNaN(num) ? 0 : num
}

// V1.0: Lee estructura horizontal (fechas en columnas)
function parseSnapshotsFromV1(rows) {
  if (!rows || rows.length < 2) return []

  const header = rows[0]
  const dateColumns = []
  let foundDates = false

  for (let i = 4; i < header.length; i++) {
    const date = serialToDate(header[i])
    if (date) {
      dateColumns.push({ index: i, date })
      foundDates = true
    } else if (foundDates) {
      break
    }
  }

  if (dateColumns.length === 0) return []

  const snapshots = []

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length < 3) continue

    const banco = row[1] ? String(row[1]).trim() : ''
    const etiqueta = row[2] ? String(row[2]).trim() : ''

    // Skip totals row
    if (!banco && !etiqueta) continue

    const name = etiqueta ? `${banco} - ${etiqueta}` : banco
    if (!name || name === '-') continue

    // Crear snapshot para cada fecha con saldo
    for (const dc of dateColumns) {
      const saldo = getVal(row, dc.index)
      if (saldo > 0) {
        snapshots.push({
          fecha: dc.date,
          banco,
          etiqueta,
          saldo
        })
      }
    }
  }

  return snapshots
}

// V1.1: Lee estructura vertical (una fila por snapshot)
function parseSnapshotsFromV11(rows) {
  if (!rows || rows.length < 2) return []

  // Header: FECHA, BANCO, ETIQUETA, SALDO
  return rows.slice(1)
    .filter(row => row && row.length >= 4)
    .map(row => ({
      fecha: serialToDate(row[0]),
      banco: String(row[1]).trim(),
      etiqueta: String(row[2]).trim(),
      saldo: getVal(row, 3)
    }))
    .filter(s => s.saldo > 0 && s.fecha && s.banco)
}

// Intentar ambas estructuras y devolver la que funciona
async function loadSnapshots(accessToken, spreadsheetId) {
  const ranges = ['SNAPSHOTS!A:D', 'SAVINGS!A:AM'].map(r => `ranges=${encodeURIComponent(r)}`).join('&')
  const url = `${SHEETS_API}/${spreadsheetId}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE`

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  const valueRanges = response.data.valueRanges
  let snapshots = []

  // Intentar v1.1 primero (SNAPSHOTS)
  if (valueRanges[0]?.values && valueRanges[0].values.length > 1) {
    snapshots = parseSnapshotsFromV11(valueRanges[0].values)
    if (snapshots.length > 0) {
      console.log(`Loaded ${snapshots.length} snapshots from SNAPSHOTS (v1.1)`)
      return snapshots
    }
  }

  // Fallback a v1.0 (SAVINGS)
  if (valueRanges[1]?.values && valueRanges[1].values.length > 1) {
    snapshots = parseSnapshotsFromV1(valueRanges[1].values)
    if (snapshots.length > 0) {
      console.log(`Loaded ${snapshots.length} snapshots from SAVINGS (v1.0)`)
      return snapshots
    }
  }

  throw new Error('No se encontraron snapshots en SNAPSHOTS ni SAVINGS')
}

function parseCostsSheet(rows) {
  if (!rows || rows.length < 2) return { expenses: [], monthlyExpense: [], expensesByMonth: {} }

  const categoryTotals = {}
  const monthlyTotals = {}
  const expensesByMonth = {}
  const detailByMonth = {}
  const allTransactions = []
  let grandTotal = 0

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length < 5) continue

    const yearMonth = row[1] ? String(row[1]).trim() : ''
    const clasificacion = row[2] ? String(row[2]).trim() : ''
    const categoria = row[3] ? String(row[3]).trim() : ''
    const costo = getVal(row, 4)

    if (!clasificacion || costo <= 0) continue

    categoryTotals[clasificacion] = (categoryTotals[clasificacion] || 0) + costo
    grandTotal += costo

    allTransactions.push({ yearMonth, clasificacion, categoria, costo })

    if (yearMonth) {
      monthlyTotals[yearMonth] = (monthlyTotals[yearMonth] || 0) + costo

      if (!expensesByMonth[yearMonth]) {
        expensesByMonth[yearMonth] = {}
      }
      expensesByMonth[yearMonth][clasificacion] = (expensesByMonth[yearMonth][clasificacion] || 0) + costo

      // Detalle por subcategoria dentro de cada clasificacion por mes
      const detailKey = `${yearMonth}|${clasificacion}`
      if (!detailByMonth[detailKey]) {
        detailByMonth[detailKey] = {}
      }
      detailByMonth[detailKey][categoria] = (detailByMonth[detailKey][categoria] || 0) + costo
    }
  }

  const expenses = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      pct: grandTotal > 0 ? Math.round((value / grandTotal) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.value - a.value)

  const monthlyExpense = Object.entries(monthlyTotals)
    .map(([month, total]) => ({ month, total: Math.round(total) }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Convertir expensesByMonth a array de objetos con name, value, pct por cada mes
  const expensesByMonthProcessed = {}
  Object.entries(expensesByMonth).forEach(([month, categories]) => {
    const monthTotal = monthlyTotals[month]
    expensesByMonthProcessed[month] = Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        pct: monthTotal > 0 ? Math.round((value / monthTotal) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.value - a.value)
  })

  const topExpenses = allTransactions
    .sort((a, b) => b.costo - a.costo)

  // Procesar detalle: { "2026-05|HOGAR": { "Arriendo": 4200000, "Servicios EPM": 391200 } }
  // -> { "2026-05": { "HOGAR": [{ name: "Arriendo", value: 4200000 }, ...] } }
  const detailProcessed = {}
  Object.entries(detailByMonth).forEach(([key, subcats]) => {
    const [month, clasificacion] = key.split('|')
    if (!detailProcessed[month]) detailProcessed[month] = {}
    detailProcessed[month][clasificacion] = Object.entries(subcats)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  })

  return { expenses, monthlyExpense, expensesByMonth: expensesByMonthProcessed, topExpenses, expenseDetail: detailProcessed }
}

function parseMovementsSheet(rows) {
  if (!rows || rows.length < 2) return { movements: [], depositsByMonth: {} }

  const movements = rows.slice(1)
    .filter(row => row && row.length >= 5 && row[0] && row[1])
    .map(row => ({
      fecha: serialToDate(row[0]),
      banco: String(row[1]).trim(),
      etiqueta: String(row[2]).trim(),
      monto: getVal(row, 3),
      tipo: String(row[4]).trim().toUpperCase()
    }))
    .filter(m => m.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  const depositsByMonth = {}
  movements.forEach(m => {
    if (m.tipo === 'DEPOSITO' && m.monto > 0) {
      const month = m.fecha.slice(0, 7)
      depositsByMonth[month] = (depositsByMonth[month] || 0) + m.monto
    }
  })

  return { movements, depositsByMonth }
}

// Hoja INGRESOS: FECHA | CONSULTORIO | INGRESO.
// INGRESO vacio significa "pago pendiente" (no es lo mismo que $0) — la hoja
// suele omitir la celda C por completo en ese caso, no basta con filtrar por
// longitud de fila.
function parseIncomeSheet(rows) {
  if (!rows || rows.length < 2) {
    return { incomeByMonth: {}, incomeByConsultorioMonth: {}, pendingByMonth: {} }
  }

  const incomeByMonth = {}
  const incomeByConsultorioMonth = {}
  const pendingByMonth = {}

  rows.slice(1).forEach(row => {
    if (!row || row.length < 2) return
    const fecha = serialToDate(row[0])
    const consultorio = row[1] ? String(row[1]).trim() : ''
    if (!fecha || !consultorio) return
    const month = fecha.slice(0, 7)

    const raw = row.length > 2 ? row[2] : undefined
    const isPending = raw === undefined || raw === null || raw === ''

    if (isPending) {
      if (!pendingByMonth[month]) pendingByMonth[month] = []
      pendingByMonth[month].push(consultorio)
      return
    }

    const monto = getVal(row, 2)
    if (monto <= 0) return

    incomeByMonth[month] = (incomeByMonth[month] || 0) + monto
    if (!incomeByConsultorioMonth[month]) incomeByConsultorioMonth[month] = {}
    incomeByConsultorioMonth[month][consultorio] = (incomeByConsultorioMonth[month][consultorio] || 0) + monto
  })

  return { incomeByMonth, incomeByConsultorioMonth, pendingByMonth }
}

// Hoja ANALISIS: LUGAR | CONSULTORIO | MINIMO | PROMEDIO | MAXIMO.
// Rango historico de ingreso esperado por consultorio, mantenido a mano.
function parseAnalisisSheet(rows) {
  if (!rows || rows.length < 2) return []

  return rows.slice(1)
    .filter(row => row && row[1])
    .map(row => ({
      lugar: row[0] ? String(row[0]).trim() : '',
      consultorio: String(row[1]).trim(),
      minimo: getVal(row, 2),
      promedio: getVal(row, 3),
      maximo: getVal(row, 4)
    }))
}

// Hoja PRESUPUESTO: CATEGORIA | SUBCATEGORIA | PRESUPUESTO | TIPO.
// Se consolida a una fila por CATEGORIA sumando el presupuesto de sus
// subcategorias (SUBCATEGORIA y TIPO no se usan a este nivel).
function parseBudgetSheet(rows) {
  if (!rows || rows.length < 2) return []

  const totals = {}
  rows.slice(1).forEach(row => {
    if (!row || !row[0]) return
    const categoria = String(row[0]).trim()
    totals[categoria] = (totals[categoria] || 0) + getVal(row, 2)
  })

  return Object.entries(totals)
    .map(([categoria, presupuesto]) => ({ categoria, presupuesto }))
    .filter(b => b.presupuesto > 0)
}

export async function appendCostRow(accessToken, spreadsheetId, { fecha, clasificacion, categoria, costo }) {
  // Columna B se deja vacia aqui: la hoja calcula el año-mes con formula
  // (=TEXTO(A55;"yyyy-mm")), igual que las filas existentes, en vez de texto
  // plano. La hoja esta en configuracion regional en espanol, por lo que la
  // formula debe usar el nombre de funcion localizado (TEXTO) y punto y coma
  // como separador de argumentos, no TEXT(...,...) en ingles.
  const appendUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent('GASTOS!A:E')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const appendBody = { values: [[fecha, '', clasificacion.trim(), categoria.trim(), costo]] }

  const appendRes = await axios.post(appendUrl, appendBody, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  const updatedRange = appendRes.data?.updates?.updatedRange || ''
  const row = updatedRange.match(/![A-Z]+(\d+)/)?.[1]

  if (row) {
    const formulaUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(`GASTOS!B${row}`)}?valueInputOption=USER_ENTERED`
    await axios.put(formulaUrl, { values: [[`=TEXTO(A${row};"yyyy-mm")`]] }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  }
}

export async function appendIncomeRow(accessToken, spreadsheetId, { fecha, consultorio, monto }) {
  // INGRESOS!A:C es FECHA | CONSULTORIO | MONTO, sin columna con formula
  // (a diferencia de GASTOS!B), asi que un solo append basta.
  const appendUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent('INGRESOS!A:C')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const appendBody = { values: [[fecha, consultorio.trim(), monto]] }

  await axios.post(appendUrl, appendBody, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}

export async function fetchSheetData(accessToken, spreadsheetId) {
  // Leer SNAPSHOTS/SAVINGS (opcional: hojas de cuentas/patrimonio, no todos los
  // spreadsheets las tienen — ej. FINANZAS JULI no trackea cuentas)
  let snapshots = []
  try {
    snapshots = await loadSnapshots(accessToken, spreadsheetId)
  } catch {
    // SNAPSHOTS/SAVINGS no existen en este spreadsheet
  }

  // Leer GASTOS
  const costsUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent('GASTOS!A:E')}?valueRenderOption=UNFORMATTED_VALUE`
  const costsResponse = await axios.get(costsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  const { expenses, monthlyExpense, expensesByMonth, topExpenses, expenseDetail } = parseCostsSheet(
    costsResponse.data.values
  )

  // Leer MOVIMIENTOS (opcional)
  let movements = []
  let depositsByMonth = {}
  try {
    const movUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent('MOVIMIENTOS!A:F')}?valueRenderOption=UNFORMATTED_VALUE`
    const movResponse = await axios.get(movUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const parsed = parseMovementsSheet(movResponse.data.values)
    movements = parsed.movements
    depositsByMonth = parsed.depositsByMonth
  } catch {
    // MOVIMIENTOS no existe
  }

  // Leer INGRESOS (opcional)
  let incomeByMonth = {}
  let incomeByConsultorioMonth = {}
  let pendingIncomeByMonth = {}
  try {
    const incUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent('INGRESOS!A:C')}?valueRenderOption=UNFORMATTED_VALUE`
    const incResponse = await axios.get(incUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const parsedIncome = parseIncomeSheet(incResponse.data.values)
    incomeByMonth = parsedIncome.incomeByMonth
    incomeByConsultorioMonth = parsedIncome.incomeByConsultorioMonth
    pendingIncomeByMonth = parsedIncome.pendingByMonth
  } catch {
    // INGRESOS no existe
  }

  // Leer ANALISIS (opcional): rango historico de ingreso por consultorio
  let analisis = []
  try {
    const analisisUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent('ANALISIS!A:E')}?valueRenderOption=UNFORMATTED_VALUE`
    const analisisResponse = await axios.get(analisisUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    analisis = parseAnalisisSheet(analisisResponse.data.values)
  } catch {
    // ANALISIS no existe
  }

  // Leer PRESUPUESTO (opcional)
  let budget = []
  try {
    const budgetUrl = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent('PRESUPUESTO!A:D')}?valueRenderOption=UNFORMATTED_VALUE`
    const budgetResponse = await axios.get(budgetUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    budget = parseBudgetSheet(budgetResponse.data.values)
  } catch {
    // PRESUPUESTO no existe
  }

  // Contar cuentas por fecha para detectar snapshots incompletos
  const accountsByDate = {}
  snapshots.forEach(s => {
    if (!accountsByDate[s.fecha]) accountsByDate[s.fecha] = 0
    accountsByDate[s.fecha]++
  })

  // El numero esperado de cuentas es el maximo encontrado
  const expectedAccounts = Math.max(...Object.values(accountsByDate), 0)
  const minAccounts = Math.floor(expectedAccounts * 0.7)

  // Filtrar fechas con datos incompletos (menos del 70% de cuentas esperadas)
  const completeDates = new Set(
    Object.entries(accountsByDate)
      .filter(([_, count]) => count >= minAccounts)
      .map(([date]) => date)
  )
  const completeSnapshots = snapshots.filter(s => completeDates.has(s.fecha))

  // Reconstruir savings desde la ultima fecha COMPLETA
  const latestDate = completeSnapshots.length > 0
    ? completeSnapshots.reduce((max, s) => s.fecha > max ? s.fecha : max, '')
    : null

  const savings = {}
  const trend = {}

  if (latestDate) {
    completeSnapshots
      .filter(s => s.fecha === latestDate)
      .forEach(s => {
        const key = s.etiqueta ? `${s.banco} - ${s.etiqueta}` : s.banco
        savings[key] = s.saldo
      })

    completeSnapshots.forEach(s => {
      trend[s.fecha] = (trend[s.fecha] || 0) + s.saldo
    })
  }

  const trendArray = Object.entries(trend)
    .map(([date, total]) => ({ date, total: Math.round(total) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    savings,
    expenses,
    monthlyExpense,
    expensesByMonth,
    expenseDetail,
    topExpenses,
    depositsByMonth,
    incomeByMonth,
    incomeByConsultorioMonth,
    pendingIncomeByMonth,
    analisis,
    budget,
    trend: trendArray,
    movements,
    snapshots: completeSnapshots
  }
}
