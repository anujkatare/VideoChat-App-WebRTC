import React, { createContext, useContext, useState, useEffect } from 'react'
import { googleLogout } from '@react-oauth/google'
import { decodeGoogleJwt } from '../utils/decodeGoogleJwt'

const AuthContext = createContext(null)

// 1. MUST BE EXPORTED HERE so all pages can import { useAuth }
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const persistUser = (userData) => {
  localStorage.setItem('aurachat_user', JSON.stringify(userData))
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('aurachat_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Error parsing user session', e)
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    const profileId = 'usr_' + Math.abs(email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)).toString(36)

    const userData = { email, profileId, name: email.split('@')[0], authProvider: 'local' }
    persistUser(userData)
    setUser(userData)
    return { success: true }
  }

  const register = (email, password, name) => {
    const profileId = 'usr_' + Math.abs(email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)).toString(36)

    const userData = { email, profileId, name: name || email.split('@')[0], authProvider: 'local' }
    persistUser(userData)
    setUser(userData)
    return { success: true }
  }

  const loginWithGoogleCredential = (credential) => {
    const payload = decodeGoogleJwt(credential)

    if (!payload?.email) {
      throw new Error('Google account did not provide an email address.')
    }

    const userData = {
      email: payload.email,
      profileId: payload.sub,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || null,
      authProvider: 'google',
    }

    persistUser(userData)
    setUser(userData)
    return { success: true }
  }

  const logout = () => {
    const savedUser = localStorage.getItem('aurachat_user')
    let authProvider = user?.authProvider

    if (!authProvider && savedUser) {
      try {
        authProvider = JSON.parse(savedUser).authProvider
      } catch {
        // ignore parse errors
      }
    }

    if (authProvider === 'google') {
      try {
        googleLogout()
      } catch (e) {
        console.warn('Google logout skipped:', e)
      }
    }

    localStorage.removeItem('aurachat_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogleCredential, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export default AuthProvider