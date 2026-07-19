import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { appendIncomeRow } from '../services/googleSheets'
import { formatCurrency, formatMonth } from '../utils/formatters'
import './AddExpenseModal.css'

const OTRA = '__otra__'
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyForm() {
  return {
    fecha: todayISO(),
    consultorio: '',
    consultorioCustom: '',
    monto: ''
  }
}

export default function AddIncomeModal({ onClose, onSuccess, consultorioOptions }) {
  const { accessToken, login } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorKind, setErrorKind] = useState(null) // 'auth' | 'generic'
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved] = useState(null)

  const isCustomConsultorio = form.consultorio === OTRA
  const effectiveConsultorio = isCustomConsultorio ? form.consultorioCustom : form.consultorio

  const yearMonth = form.fecha ? form.fecha.slice(0, 7) : ''

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validate() {
    const errors = {}
    if (!effectiveConsultorio.trim()) errors.consultorio = 'Elige o escribe un consultorio.'
    const num = Number(form.monto)
    if (!form.monto || isNaN(num) || num <= 0) errors.monto = 'Ingresa un valor mayor a $0.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'submitting') return
    if (!validate()) return

    setStatus('submitting')
    try {
      const monto = Number(form.monto)
      await appendIncomeRow(accessToken, SHEET_ID, {
        fecha: form.fecha,
        consultorio: effectiveConsultorio,
        monto
      })
      setSaved({ consultorio: effectiveConsultorio, monto, yearMonth })
      setStatus('success')
      onSuccess?.()
    } catch (err) {
      setStatus('error')
      setErrorKind(err.response?.status === 403 ? 'auth' : 'generic')
    }
  }

  function handleAddAnother() {
    setForm(emptyForm())
    setFieldErrors({})
    setSaved(null)
    setErrorKind(null)
    setStatus('idle')
  }

  return (
    <div className="add-expense-overlay" onClick={onClose}>
      <div className="add-expense-card" onClick={e => e.stopPropagation()}>
        <div className="add-expense-header">
          <h2>Agregar ingreso</h2>
          <button className="add-expense-close" onClick={onClose} aria-label="Cerrar">&times;</button>
        </div>

        {status === 'success' && saved ? (
          <div className="add-expense-success">
            <p className="add-expense-success-title">Ingreso agregado correctamente</p>
            <p className="add-expense-success-detail">
              {saved.consultorio} · {formatCurrency(saved.monto)} ({formatMonth(saved.yearMonth)})
            </p>
            <div className="add-expense-actions">
              <button type="button" className="add-expense-btn-secondary" onClick={handleAddAnother}>Agregar otro</button>
              <button type="button" className="add-expense-btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="add-expense-field">
              <label htmlFor="ai-fecha">Fecha</label>
              <input
                id="ai-fecha"
                type="date"
                value={form.fecha}
                onChange={e => updateField('fecha', e.target.value)}
                disabled={status === 'submitting'}
                required
              />
            </div>

            <div className="add-expense-field">
              <label htmlFor="ai-consultorio">Consultorio</label>
              {isCustomConsultorio ? (
                <div className="add-expense-custom-row">
                  <input
                    id="ai-consultorio"
                    type="text"
                    autoFocus
                    placeholder="Nuevo consultorio"
                    value={form.consultorioCustom}
                    onChange={e => updateField('consultorioCustom', e.target.value)}
                    disabled={status === 'submitting'}
                  />
                  <button type="button" className="add-expense-link" onClick={() => updateField('consultorio', '')}>
                    Volver a la lista
                  </button>
                </div>
              ) : (
                <div className="add-expense-box-grid" id="ai-consultorio" role="group" aria-label="Consultorio">
                  {consultorioOptions.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`add-expense-box ${form.consultorio === c ? 'active' : ''}`}
                      onClick={() => updateField('consultorio', c)}
                      disabled={status === 'submitting'}
                    >
                      <span className="add-expense-box-label">{c}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="add-expense-box"
                    onClick={() => updateField('consultorio', OTRA)}
                    disabled={status === 'submitting'}
                  >
                    <span className="add-expense-box-icon">➕</span>
                    <span className="add-expense-box-label">Otra</span>
                  </button>
                </div>
              )}
              {fieldErrors.consultorio && <span className="add-expense-field-error">{fieldErrors.consultorio}</span>}
            </div>

            <div className="add-expense-field">
              <label htmlFor="ai-monto">Valor recibido</label>
              <input
                id="ai-monto"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.monto}
                onChange={e => updateField('monto', e.target.value)}
                disabled={status === 'submitting'}
              />
              {form.monto !== '' && !isNaN(Number(form.monto)) && (
                <span className="add-expense-preview">{formatCurrency(Number(form.monto))}</span>
              )}
              {fieldErrors.monto && <span className="add-expense-field-error">{fieldErrors.monto}</span>}
            </div>

            {yearMonth && <p className="add-expense-month">Mes: {formatMonth(yearMonth)}</p>}

            {status === 'error' && errorKind === 'auth' && (
              <div className="add-expense-banner">
                <span>Tu sesión no tiene permiso para escribir en la hoja. Reconecta tu cuenta de Google.</span>
                <button type="button" className="add-expense-btn-primary" onClick={login}>Reconectar</button>
              </div>
            )}
            {status === 'error' && errorKind === 'generic' && (
              <div className="add-expense-banner">
                <span>No se pudo guardar el ingreso. Intenta de nuevo.</span>
                <button type="submit" className="add-expense-btn-primary">Reintentar</button>
              </div>
            )}

            <div className="add-expense-actions">
              <button type="button" className="add-expense-btn-secondary" onClick={onClose} disabled={status === 'submitting'}>
                Cancelar
              </button>
              <button type="submit" className="add-expense-btn-primary" disabled={status === 'submitting'}>
                {status === 'submitting' ? (<><span className="add-expense-spinner" />Guardando...</>) : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
