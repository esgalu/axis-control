import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatDateShort, formatCurrency, formatShortCurrency } from '../../utils/formatters'
import './AccountsEvolution.css'

const ACCOUNT_COLORS = [
  '#185FA5', '#0C447C', '#378ADD', '#6B8E23', '#c62828',
  '#f57c00', '#7b1fa2', '#00796b', '#512da8', '#e91e63'
]

export default function AccountsEvolution({ accounts, trend }) {
  if (!accounts || accounts.length === 0 || !trend || trend.length === 0) {
    return (
      <div className="tab-content">
        <div className="section">
          <h2>Evolución de Cuentas</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Datos insuficientes para mostrar evolución
          </p>
        </div>
      </div>
    )
  }

  const accountsByBank = useMemo(() => {
    const map = {}
    accounts.forEach(a => {
      const parts = a.name.split(' - ')
      const banco = parts[0] || a.name
      const etiqueta = parts.slice(1).join(' - ') || null
      if (!map[banco]) map[banco] = []
      map[banco].push({ ...a, banco, etiqueta })
    })
    return map
  }, [accounts])

  const bancos = Object.keys(accountsByBank).sort()
  const [selectedBanco, setSelectedBanco] = useState('todos')
  const [selectedEtiquetas, setSelectedEtiquetas] = useState(accounts.map(a => a.name))

  const visibleEtiquetas = useMemo(() => {
    if (selectedBanco === 'todos') return accounts
    return accountsByBank[selectedBanco] || []
  }, [selectedBanco, accounts, accountsByBank])

  const handleBancoChange = (banco) => {
    setSelectedBanco(banco)
    if (banco === 'todos') {
      setSelectedEtiquetas(accounts.map(a => a.name))
    } else {
      setSelectedEtiquetas((accountsByBank[banco] || []).map(a => a.name))
    }
  }

  const handleEtiquetaToggle = (name) => {
    setSelectedEtiquetas(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    )
  }

  const handleSelectAll = () => {
    const visible = visibleEtiquetas.map(a => a.name)
    const allSelected = visible.every(n => selectedEtiquetas.includes(n))
    if (allSelected) {
      setSelectedEtiquetas(prev => prev.filter(n => !visible.includes(n)))
    } else {
      setSelectedEtiquetas(prev => [...new Set([...prev, ...visible])])
    }
  }

  return (
    <div className="tab-content">
      <div className="section">
        <h2>Evolución de Cuentas</h2>

        <div className="account-filter">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Banco</label>
              <select
                className="filter-select"
                value={selectedBanco}
                onChange={e => handleBancoChange(e.target.value)}
              >
                <option value="todos">Todos los bancos</option>
                {bancos.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <button className="select-all-btn" onClick={handleSelectAll}>
              {visibleEtiquetas.every(a => selectedEtiquetas.includes(a.name))
                ? 'Deseleccionar todas'
                : 'Seleccionar todas'}
            </button>
          </div>

          <div className="account-checkboxes">
            {visibleEtiquetas.map((account, idx) => (
              <label key={account.name} className="account-checkbox">
                <input
                  type="checkbox"
                  checked={selectedEtiquetas.includes(account.name)}
                  onChange={() => handleEtiquetaToggle(account.name)}
                />
                <span
                  className="checkbox-color"
                  style={{ backgroundColor: ACCOUNT_COLORS[accounts.indexOf(account) % ACCOUNT_COLORS.length] }}
                />
                <span className="checkbox-label">{account.etiqueta || account.name}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedEtiquetas.length > 0 ? (
          <div className="chart-container tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => formatDateShort(date)}
                  interval={Math.max(0, Math.floor(trend.length / 6) - 1)}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatShortCurrency}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(date) => formatDateShort(date)}
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend />
                {selectedEtiquetas.map((accountName) => {
                  const accountData = accounts.find(a => a.name === accountName)
                  if (!accountData) return null
                  const globalIdx = accounts.indexOf(accountData)

                  return (
                    <Line
                      key={accountName}
                      type="monotone"
                      dataKey={accountName}
                      stroke={ACCOUNT_COLORS[globalIdx % ACCOUNT_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                      name={accountData.etiqueta || accountName}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Selecciona al menos una cuenta para ver la evolución
          </p>
        )}
      </div>
    </div>
  )
}
