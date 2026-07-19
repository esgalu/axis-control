import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'
import { formatDateShort, formatMonth, formatCurrency, formatShortCurrency, calculateChange } from '../../utils/formatters'
import '../tabs/Trends.css'

export default function Trends({ trend, projectedTrend, accounts, monthlyIncome, incomeStats, projectedIncomeTrend, mobileMode }) {
  const validTrend = (trend || []).filter(item => item.date && typeof item.total === 'number')
  const hasPatrimonyTrend = validTrend.length > 0
  const hasIncomeTrend = monthlyIncome && monthlyIncome.length > 0 && incomeStats

  if (!hasPatrimonyTrend && !hasIncomeTrend) {
    return (
      <div className="tab-content">
        <div className="section">
          <h2>Tendencias</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tab-content">
      {hasIncomeTrend && (
        <IncomeTrendSection
          monthlyIncome={monthlyIncome}
          incomeStats={incomeStats}
          projectedIncomeTrend={projectedIncomeTrend}
          mobileMode={mobileMode}
        />
      )}

      {hasPatrimonyTrend && (
        <PatrimonyTrendSection validTrend={validTrend} projectedTrend={projectedTrend} mobileMode={mobileMode} />
      )}

      {accounts && accounts.length > 0 && (
        <div className="section">
          <h2>Composición del Patrimonio</h2>
          <p className="trends-subtitle">Porcentaje que cada cuenta aporta al total</p>
          <div className="composition-list">
            {accounts
              .filter(a => a.share > 0)
              .sort((a, b) => b.share - a.share)
              .map((a, idx) => (
                <div key={idx} className="composition-item">
                  <div className="composition-info">
                    <span className="composition-name">{a.etiqueta || a.name}</span>
                    <span className="composition-banco">{a.banco}</span>
                  </div>
                  <div className="composition-bar-container">
                    <div className="composition-bar" style={{ width: `${Math.max(a.share, 1)}%` }} />
                  </div>
                  <span className="composition-pct">{a.share.toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IncomeTrendSection({ monthlyIncome, incomeStats, projectedIncomeTrend, mobileMode }) {
  const chartData = [
    ...monthlyIncome.map(m => ({ month: m.month, total: m.total, projected: null })),
    ...(projectedIncomeTrend || []).map(p => ({ month: p.month, total: p.total ?? null, projected: p.projected }))
  ]

  const projectedEnd = projectedIncomeTrend && projectedIncomeTrend.length > 0
    ? projectedIncomeTrend[projectedIncomeTrend.length - 1].projected
    : null

  return (
    <div className="section">
      <div className="trends-header">
        <div>
          <h2>Ingresos Mensuales</h2>
          <p className="trends-subtitle">
            Promedio {formatCurrency(incomeStats.promedio)} · Variabilidad ±{formatShortCurrency(incomeStats.stdDev)} ({incomeStats.variabilidad.toFixed(1)}%)
            {projectedEnd && (
              <span className="trends-projection-label">
                {' · '}Proyección 2 meses: {formatCurrency(projectedEnd)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="trend-stats-row">
        <TrendStat label="Mínimo" value={formatCurrency(incomeStats.minimo)} color="var(--color-danger)" />
        <TrendStat label="Promedio" value={formatCurrency(incomeStats.promedio)} color="var(--text-primary)" />
        <TrendStat label="Máximo" value={formatCurrency(incomeStats.maximo)} color="var(--color-success)" />
        <TrendStat label="Variabilidad mensual" value={`±${incomeStats.variabilidad.toFixed(1)}%`} color="var(--text-primary)" />
      </div>

      <div className="chart-container tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: mobileMode ? 40 : 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={mobileMode ? { fontSize: 9, angle: -35, textAnchor: 'end' } : { fontSize: 12 }}
              tickFormatter={(month) => formatMonth(month)}
              height={mobileMode ? 48 : 30}
            />
            <YAxis
              tick={{ fontSize: mobileMode ? 9 : 12 }}
              tickFormatter={formatShortCurrency}
              width={mobileMode ? 52 : 60}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value),
                name === 'projected' ? 'Proyectado' : 'Ingreso Real'
              ]}
              labelFormatter={(month) => formatMonth(month)}
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--text-primary)'
              }}
            />
            <Legend formatter={(value) => value === 'projected' ? 'Proyectado' : 'Ingreso Real'} />
            <ReferenceLine
              y={incomeStats.minimo}
              stroke="var(--color-danger)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{ value: `Mínimo: ${formatShortCurrency(incomeStats.minimo)}`, position: 'insideBottomLeft', fill: 'var(--color-danger)', fontSize: 10 }}
            />
            <ReferenceLine
              y={incomeStats.promedio}
              stroke="var(--text-muted)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{ value: `Promedio: ${formatShortCurrency(incomeStats.promedio)}`, position: 'insideTopLeft', fill: 'var(--text-muted)', fontSize: 10 }}
            />
            <ReferenceLine
              y={incomeStats.maximo}
              stroke="var(--color-success)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{ value: `Máximo: ${formatShortCurrency(incomeStats.maximo)}`, position: 'insideTopLeft', fill: 'var(--color-success)', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--color-primary)"
              strokeWidth={3}
              dot={{ fill: 'var(--color-primary)', r: 4 }}
              activeDot={{ r: 6 }}
              name="total"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#85B7EB"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              name="projected"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TrendStat({ label, value, color }) {
  return (
    <div className="trend-stat-item">
      <span className="trend-stat-label">{label}</span>
      <span className="trend-stat-value" style={{ color }}>{value}</span>
    </div>
  )
}

function PatrimonyTrendSection({ validTrend, projectedTrend, mobileMode }) {
  const firstValue = validTrend[0]?.total || 0
  const lastValue = validTrend[validTrend.length - 1]?.total || 0
  const changePercent = calculateChange(lastValue, firstValue)
  const trendDirection = changePercent > 0 ? '↑' : '↓'
  const trendColor = changePercent > 0 ? 'var(--color-success)' : 'var(--color-danger)'

  // Combinar datos reales + proyeccion
  const chartData = [
    ...validTrend.map(d => ({ date: d.date, total: d.total, projected: null })),
    ...(projectedTrend || []).map(d => ({ date: d.date, total: d.total || null, projected: d.projected }))
  ]

  const projectedEnd = projectedTrend && projectedTrend.length > 0
    ? projectedTrend[projectedTrend.length - 1].projected
    : null

  return (
    <div className="section">
      <div className="trends-header">
        <div>
          <h2>Evolución del Patrimonio</h2>
          <p className="trends-subtitle">
            <span style={{ color: trendColor, fontWeight: 'bold' }}>
              {trendDirection} {Math.abs(changePercent).toFixed(1)}%
            </span>
            {' '}desde {formatDateShort(validTrend[0]?.date)}
            {projectedEnd && (
              <span className="trends-projection-label">
                {' · '}Proyección 3 meses: {formatCurrency(projectedEnd)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="chart-container tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={mobileMode ? { fontSize: 9, angle: -45, textAnchor: 'end' } : { fontSize: 12 }}
              tickFormatter={(date) => formatDateShort(date)}
              interval={mobileMode ? Math.floor(chartData.length / 4) : Math.floor(chartData.length / 6)}
              height={mobileMode ? 48 : 30}
            />
            <YAxis
              tick={{ fontSize: mobileMode ? 9 : 12 }}
              tickFormatter={formatShortCurrency}
              width={mobileMode ? 52 : 60}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value),
                name === 'projected' ? 'Proyectado' : 'Patrimonio Real'
              ]}
              labelFormatter={(date) => formatDateShort(date)}
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--text-primary)'
              }}
            />
            <Legend formatter={(value) => value === 'projected' ? 'Proyectado' : 'Patrimonio Real'} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--color-primary)"
              strokeWidth={3}
              dot={{ fill: 'var(--color-primary)', r: 4 }}
              activeDot={{ r: 6 }}
              name="total"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#85B7EB"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              name="projected"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
