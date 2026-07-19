import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'

const AuthContext = createContext(null)

const TOKEN_KEY = 'gsheets_access_token'
const EXPIRY_KEY = 'gsheets_token_expiry'
const USER_KEY = 'gsheets_user'

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserInfo = useCallback(async (token) => {
    try {
      const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userData = { name: res.data.name, email: res.data.email, picture: res.data.picture }
      setUser(userData)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
    } catch {
      // Token might be expired
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedExpiry = localStorage.getItem(EXPIRY_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedExpiry && Number(storedExpiry) > Date.now()) {
      setAccessToken(storedToken)
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        fetchUserInfo(storedToken)
      }
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(EXPIRY_KEY)
      localStorage.removeItem(USER_KEY)
    }
    setIsLoading(false)
  }, [fetchUserInfo])

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    onSuccess: (tokenResponse) => {
      const token = tokenResponse.access_token
      const expiresAt = Date.now() + tokenResponse.expires_in * 1000
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(EXPIRY_KEY, String(expiresAt))
      setAccessToken(token)
      fetchUserInfo(token)
    },
    onError: () => {
      setAccessToken(null)
      setUser(null)
    }
  })

  const logout = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRY_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isAuthenticated: !!accessToken,
      isLoading,
      login: googleLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
