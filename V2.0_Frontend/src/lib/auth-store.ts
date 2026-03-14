import { create } from 'zustand'
import api from './api'

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  organization: {
    id: string
    name: string
    plan: string
    trial_start?: string
    trial_end?: string
    is_trial_locked?: boolean
    trial_days_remaining?: number
    is_trial_expired?: boolean
  } | null
  avatar_url?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => void
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login/', { email, password })
    const { access, refresh, user } = data

    localStorage.setItem('sankalp_access_token', access)
    localStorage.setItem('sankalp_refresh_token', refresh)
    localStorage.setItem('sankalp_user', JSON.stringify(user))

    set({
      user,
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  logout: async () => {
    try {
      const refreshToken = get().refreshToken
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken })
      }
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('sankalp_access_token')
      localStorage.removeItem('sankalp_refresh_token')
      localStorage.removeItem('sankalp_user')
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false })
      return
    }

    const accessToken = localStorage.getItem('sankalp_access_token')
    const refreshToken = localStorage.getItem('sankalp_refresh_token')
    const userStr = localStorage.getItem('sankalp_user')

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch {
        set({ isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },

  updateUser: (data: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      const updated = { ...currentUser, ...data }
      localStorage.setItem('sankalp_user', JSON.stringify(updated))
      set({ user: updated })
    }
  },
}))
