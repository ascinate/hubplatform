'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import SankalpHubLogo from '@/components/SankalpHubLogo'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  // Step 1 state — request reset link
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  // Step 2 state — set new password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setSendingEmail(true)
    try {
      await axios.post('https://app.sankalphub.in/api/auth/forgot-password/', { email })
    } catch {
      // Silently handle — always show success to prevent email enumeration
    } finally {
      setSendingEmail(false)
      setEmailSent(true)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setResetting(true)
    try {
      await axios.post('https://app.sankalphub.in/api/auth/reset-password/', {
        token,
        new_password: newPassword,
      })
      setResetSuccess(true)
      toast.success('Password reset successfully!')
      setTimeout(() => {
        router.push('/login')
      }, 2500)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to reset password. The link may have expired.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-elevated p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <SankalpHubLogo variant="light" height={72} className="mx-auto mb-4" />

            {/* Step 1: Request reset (no token) */}
            {!token && !emailSent && (
              <>
                <h1 className="text-2xl font-bold text-text-primary">
                  Forgot your password?
                </h1>
                <p className="text-text-muted mt-2 text-sm">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </>
            )}

            {/* Step 1: Email sent confirmation */}
            {!token && emailSent && (
              <>
                <h1 className="text-2xl font-bold text-text-primary">
                  Check your inbox!
                </h1>
              </>
            )}

            {/* Step 2: Set new password (has token) */}
            {token && !resetSuccess && (
              <>
                <h1 className="text-2xl font-bold text-text-primary">
                  Set a new password
                </h1>
                <p className="text-text-muted mt-2 text-sm">
                  Choose a strong password for your account
                </p>
              </>
            )}

            {/* Step 2: Reset success */}
            {token && resetSuccess && (
              <>
                <h1 className="text-2xl font-bold text-text-primary">
                  Password reset successfully!
                </h1>
              </>
            )}
          </div>

          {/* Step 1: Email form */}
          {!token && !emailSent && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={sendingEmail}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Send Reset Link
                  </>
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* Step 1: Email sent success */}
          {!token && emailSent && (
            <div className="text-center space-y-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-success-light rounded-full">
                <CheckCircle size={28} className="text-success" />
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                If an account exists for <strong className="text-text-primary">{email}</strong>, we&apos;ve sent a reset link. Please check your inbox and spam folder.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: New password form */}
          {token && !resetSuccess && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="New password (min. 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors pr-12"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors pr-12"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-danger">Password must be at least 8 characters</p>
              )}
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-danger">Passwords do not match</p>
              )}

              <button
                type="submit"
                disabled={resetting}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Reset success */}
          {token && resetSuccess && (
            <div className="text-center space-y-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-success-light rounded-full">
                <CheckCircle size={28} className="text-success" />
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                Password reset successfully! Redirecting to login...
              </p>
              <Loader2 size={20} className="animate-spin text-primary mx-auto" />
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          &copy; 2026 SankalpHub. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
          <Loader2 size={32} className="animate-spin text-white" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
