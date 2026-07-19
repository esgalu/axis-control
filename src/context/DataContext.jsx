import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { fetchSheetData } from '../services/googleSheets'
import { DATA } from '../data/financialData'

const DataContext = createContext(null)

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID

export function DataProvider({ children }) {
  const { accessToken, isAuthenticated } = useAuth()
  const [data, setData] = useState(null)
  const [dataSource, setDataSource] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadGoogleData = useCallback(async (token) => {
    setIsLoading(true)
    setError(null)
    try {
      const sheetData = await fetchSheetData(token, SHEET_ID)
      setData(sheetData)
      setDataSource('google')
    } catch (err) {
      const message = err.response?.status === 401
        ? 'Sesion expirada. Reconecta tu cuenta de Google.'
        : err.response?.status === 403
          ? 'No tienes permisos para acceder a este Google Sheet.'
          : err.response?.status === 404
            ? 'No se encontro el Google Sheet. Verifica el ID en .env.local'
            : err.message || 'Error al cargar datos de Google Sheets'
      setError(message)
      setData(DATA)
      setDataSource('local')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadGoogleData(accessToken)
    } else {
      setData(null)
      setDataSource(null)
      setError(null)
      setIsLoading(false)
    }
  }, [isAuthenticated, accessToken, loadGoogleData])

  const refreshData = useCallback(() => {
    if (isAuthenticated && accessToken) {
      loadGoogleData(accessToken)
    }
  }, [isAuthenticated, accessToken, loadGoogleData])

  return (
    <DataContext.Provider value={{ data, dataSource, isLoading, error, refreshData }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}
