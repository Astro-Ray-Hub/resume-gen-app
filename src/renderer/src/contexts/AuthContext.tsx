import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import api from '../lib/api'

export interface User {
  id: string
  username: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        logout()
        return
      }

      try {
        // const decoded: User = jwtDecode(token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const res = await api.get('/users/me')
        const userInfo = res.data

        if (!userInfo.approved) {
          logout()
          new Notification('Login failed', {
            body: `User is not approved`
          })
          return
        }

        if (userInfo.role == 'super_admin') {
          logout()
          new Notification('Login failed', {
            body: `This app is for only admins and users.`
          })
          return
        }

        const finalUser = {
          id: userInfo.id,
          name: userInfo.name,
          username: userInfo.username,
          role: userInfo.roles.name,
          approved: userInfo.approved
        }

        setUser(finalUser)
      } catch {
        logout()
      }
    }
    initializeUser()
  }, [])

  const login = async (username: string, password: string) => {
    const res = await api.post('/users/login', { username, password })
    const token = res.data.token
    const decoded: User = jwtDecode(token)
    if (decoded.role == 'super_admin') {
      new Notification('Login failed', {
        body: `This app is for only admins and users.`
      })
      logout()
      return
    }
    localStorage.setItem('token', token)
    window.electron.ipcRenderer.send('auth-token', token, true)
    new Notification('Login Successful', {
      body: `Welcome back, ${decoded.username}!`
    })
    setUser(decoded)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    navigate('/')
  }

  const logout = () => {
    localStorage.removeItem('token')
    window.electron.ipcRenderer.send('auth-token', '', true)
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    navigate('/login')
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
