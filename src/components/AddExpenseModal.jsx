import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { appendCostRow } from '../services/googleSheets'
import { formatCurrency, formatMonth } from '../utils/formatters'
import './AddExpenseModal.css'

const OTRA = '__otra__'
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID

const CLASIFICACION_ICONS = {
  HOGAR: '🏠',
  DEPORTE: '🏃',
  PAREJA: '❤️',
  PERRITOS: '🐶',
  MERCADO: '🛒',
  PERSONAL: '🧴',
  AMIGOS: '🎉',
  'AI & STREAMING': '🎬',
  AUTO: '🚗',
  FAMILIA: '👨‍👩‍👧',
  BANCO: '🏦'
}
const DEFAULT_ICON = '🏷️'

function iconFor(name) {
  return CLASIFICACION_ICONS[name?.toUpperCase()] || DEFAULT_ICON
}

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
    clasificacion: '',
    clasificacionCustom: '',
    categoria: '',
    categoriaCustom: '',
    valor: ''
  }
}

export default function AddExpenseModal({ onClose, onSuccess, clasificacionOptions, categoriasByClasificacion }) {
  const { accessToken, login } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorKind, setErrorKind] = useState(null) // 'auth' | 'generic'
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved] = useState(null)

  const isCustomClasificacion = form.clasificacion === OTRA
  const effectiveClasificacion = isCustomClasificacion ? form.clasificacionCustom : form.clasificacion

  const categoriaOptions = useMemo(() => {
    if (isCustomClasificacion || !effectiveClasificacion) return []
    return categoriasByClasificacion[effectiveClasificacion] || []
  }, [isCustomClasificacion, effectiveClasificacion, categoriasByClasificacion])

  const isCustomCategoria = form.categoria === OTRA || categoriaOptions.length === 0
  const effectiveCategoria = isCustomCategoria ? form.categoriaCustom : form.categoria

  const yearMonth = form.fecha ? form.fecha.slice(0, 7) : ''

  function updateField(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'clasificacion') {
        next.categoria = ''
        next.categoriaCustom = ''
      }
      return next
    })
  }

  function validate() {
    const errors = {}
    if (!effectiveClasificacion.trim()) errors.clasificacion = 'Elige o escribe una clasificación.'
    if (!effectiveCategoria.trim()) errors.categoria = 'Elige o escribe una categoría.'
    const num = Number(form.valor)
    if (!form.valor || isNaN(num) || num <= 0) errors.valor = 'Ingresa un valor mayor a $0.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'submitting') return
    if (!validate()) return

    setStatus('submitting')
    try {
      const costo = Number(form.valor)
      await appendCostRow(accessToken, SHEET_ID, {
        fecha: form.fecha,
        clasificacion: effectiveClasificacion,
        categoria: effectiveCategoria,
        costo
      })
      setSaved({ clasificacion: effectiveClasificacion, categoria: effectiveCategoria, valor: costo, yearMonth })
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
          <h2>Agregar gasto</h2>
          <button className="add-expense-close" onClick={onClose} aria-label="Cerrar">&times;</button>
        </div>

        {status === 'success' && saved ? (
          <div className="add-expense-success">
            <p className="add-expense-success-title">Gasto agregado correctamente</p>
            <p className="add-expense-success-detail">
              {iconFor(saved.clasificacion)} {saved.clasificacion} · {saved.categoria} · {formatCurrency(saved.valor)} ({formatMonth(saved.yearMonth)})
            </p>
            <div className="add-expense-actions">
              <button type="button" className="add-expense-btn-secondary" onClick={handleAddAnother}>Agregar otro</button>
              <button type="button" className="add-expense-btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="add-expense-field">
              <label htmlFor="ae-fecha">Fecha</label>
              <input
                id="ae-fecha"
                type="date"
                value={form.fecha}
                onChange={e => updateField('fecha', e.target.value)}
                disabled={status === 'submitting'}
                required
              />
            </div>

            <div className="add-expense-field">
              <label htmlFor="ae-clasificacion">Clasificación</label>
              {isCustomClasificacion ? (
                <div className="add-expense-custom-row">
                  <input
                    id="ae-clasificacion"
                    type="text"
                    autoFocus
                    placeholder="Nueva clasificación"
                    value={form.clasificacionCustom}
                    onChange={e => updateField('clasificacionCustom', e.target.value)}
                    disabled={status === 'submitting'}
                  />
                  <button type="button" className="add-expense-link" onClick={() => updateField('clasificacion', '')}>
                    Volver a la lista
                  </button>
                </div>
              ) : (
                <div className="add-expense-box-grid" id="ae-clasificacion" role="group" aria-label="Clasificación">
                  {clasificacionOptions.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`add-expense-box ${form.clasificacion === c ? 'active' : ''}`}
                      onClick={() => updateField('clasificacion', c)}
                      disabled={status === 'submitting'}
                    >
                      <span className="add-expense-box-icon">{iconFor(c)}</span>
                      <span className="add-expense-box-label">{c}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="add-expense-box"
                    onClick={() => updateField('clasificacion', OTRA)}
                    disabled={status === 'submitting'}
                  >
                    <span className="add-expense-box-icon">➕</span>
                    <span className="add-expense-box-label">Otra</span>
                  </button>
                </div>
              )}
              {fieldErrors.clasificacion && <span className="add-expense-field-error">{fieldErrors.clasificacion}</span>}
            </div>

            <div className="add-expense-field">
              <label htmlFor="ae-categoria">Categoría</label>
              {isCustomCategoria ? (
                <div className="add-expense-custom-row">
                  <input
                    id="ae-categoria"
                    type="text"
                    placeholder="Nueva categoría"
                    value={form.categoriaCustom}
                    onChange={e => updateField('categoriaCustom', e.target.value)}
                    disabled={status === 'submitting' || !effectiveClasificacion}
                  />
                  {categoriaOptions.length > 0 && (
                    <button type="button" className="add-expense-link" onClick={() => updateField('categoria', '')}>
                      Volver a la lista
                    </button>
                  )}
                </div>
              ) : (
                <select
                  id="ae-categoria"
                  value={form.categoria}
                  onChange={e => updateField('categoria', e.target.value)}
                  disabled={status === 'submitting' || !effectiveClasificacion}
                >
                  <option value="">Selecciona...</option>
                  {categoriaOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value={OTRA}>+ Otra...</option>
                </select>
              )}
              {fieldErrors.categoria && <span className="add-expense-field-error">{fieldErrors.categoria}</span>}
            </div>

            <div className="add-expense-field">
              <label htmlFor="ae-valor">Valor</label>
              <input
                id="ae-valor"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.valor}
                onChange={e => updateField('valor', e.target.value)}
                disabled={status === 'submitting'}
              />
              {form.valor !== '' && !isNaN(Number(form.valor)) && (
                <span className="add-expense-preview">{formatCurrency(Number(form.valor))}</span>
              )}
              {fieldErrors.valor && <span className="add-expense-field-error">{fieldErrors.valor}</span>}
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
                <span>No se pudo guardar el gasto. Intenta de nuevo.</span>
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
