import { useEffect } from 'react'

const NIGHT_START_HOUR = 19
const NIGHT_END_HOUR = 7

export function getAutoTheme(date = new Date()) {
  const hour = date.getHours()
  return (hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR) ? 'dark' : 'light'
}

// Aplica claro de dia / oscuro de noche automaticamente segun la hora del dispositivo.
export function useAutoTheme() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute('data-theme', getAutoTheme())
    }
    apply()
    const id = setInterval(apply, 5 * 60 * 1000)
    document.addEventListener('visibilitychange', apply)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', apply)
    }
  }, [])
}
