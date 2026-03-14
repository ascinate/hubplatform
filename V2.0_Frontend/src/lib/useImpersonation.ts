import { useRouter } from 'next/navigation'
import { useAuthStore } from './auth-store'
import api from './api'

export function useImpersonation() {
  const router = useRouter()
  const { loadFromStorage } = useAuthStore()

  const isImpersonating = () => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sankalp_is_impersonating') === 'true'
  }

  const getImpersonatedUser = () => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('sankalp_impersonated_user')
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }

  const startImpersonation = async (userId: string) => {
    // Save current tokens
    const currentAccess = localStorage.getItem('sankalp_access_token')
    const currentRefresh = localStorage.getItem('sankalp_refresh_token')
    const currentUser = localStorage.getItem('sankalp_user')

    if (currentAccess) localStorage.setItem('sankalp_original_access_token', currentAccess)
    if (currentRefresh) localStorage.setItem('sankalp_original_refresh_token', currentRefresh)
    if (currentUser) localStorage.setItem('sankalp_original_user', currentUser)

    // Get impersonation tokens
    const { data } = await api.post(`/founder/impersonate/${userId}/`)

    // Store new tokens
    localStorage.setItem('sankalp_access_token', data.access)
    localStorage.setItem('sankalp_refresh_token', data.refresh)
    localStorage.setItem('sankalp_user', JSON.stringify(data.user))
    localStorage.setItem('sankalp_is_impersonating', 'true')
    localStorage.setItem('sankalp_impersonated_user', JSON.stringify(data.user))

    // Reload auth store
    loadFromStorage()

    // Navigate to dashboard
    router.push('/dashboard')
  }

  const endImpersonation = async () => {
    const impersonatedUser = getImpersonatedUser()

    // Log end
    try {
      // Use original tokens to make this call
      const originalAccess = localStorage.getItem('sankalp_original_access_token')
      if (originalAccess) {
        await api.post('/founder/impersonate/end/', {
          target_email: impersonatedUser?.email || '',
        }, {
          headers: { Authorization: `Bearer ${originalAccess}` },
        })
      }
    } catch {
      // Ignore errors
    }

    // Restore original tokens
    const origAccess = localStorage.getItem('sankalp_original_access_token')
    const origRefresh = localStorage.getItem('sankalp_original_refresh_token')
    const origUser = localStorage.getItem('sankalp_original_user')

    if (origAccess) localStorage.setItem('sankalp_access_token', origAccess)
    if (origRefresh) localStorage.setItem('sankalp_refresh_token', origRefresh)
    if (origUser) localStorage.setItem('sankalp_user', origUser)

    // Clean up
    localStorage.removeItem('sankalp_original_access_token')
    localStorage.removeItem('sankalp_original_refresh_token')
    localStorage.removeItem('sankalp_original_user')
    localStorage.removeItem('sankalp_is_impersonating')
    localStorage.removeItem('sankalp_impersonated_user')

    // Reload auth store
    loadFromStorage()

    // Navigate back to console
    router.push('/console')
  }

  return {
    isImpersonating,
    getImpersonatedUser,
    startImpersonation,
    endImpersonation,
  }
}
