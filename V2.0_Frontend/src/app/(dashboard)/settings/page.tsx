'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import { Eye, EyeOff, LogOut, ExternalLink } from 'lucide-react'
import TabPills from '@/components/ui/TabPills'
import RolePermissionFlow from '@/components/settings/RolePermissionFlow'
import WorkflowTemplateManager from '@/components/settings/WorkflowTemplateManager'
import DefectLibrary from '@/components/defects/DefectLibrary'
import AQLStandards from '@/components/aql/AQLStandards'
import NotificationSettings from '@/components/settings/NotificationSettings'
import InspectionTemplateManager from '@/components/settings/InspectionTemplateManager'

const tabs = [
  'Company Profile',
  'Users & Roles',
  'Workflow Templates',
  'Inspection Templates',
  'Defect Library',
  'AQL Standards',
  'Notifications',
]

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateUser, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState(0)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.patch('/auth/me/', { full_name: fullName })
      updateUser({ full_name: fullName })
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      await api.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Failed to update password. Please check your current password.')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await logout()
    router.push('/login')
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const disabledInputClass =
    'w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-gray-50 text-text-muted'

  return (
    <div className="space-y-4 lg:space-y-6">
      <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Settings</h1>

      {/* Mobile tabs — horizontal scroll pills */}
      <div className="lg:hidden">
        <TabPills
          tabs={tabs.map((t, i) => ({ id: i, label: t }))}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as number)}
        />
      </div>

      <div className="flex gap-6 overflow-hidden">
        {/* Desktop sidebar tabs */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <TabPills
            tabs={tabs.map((t, i) => ({ id: i, label: t }))}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as number)}
            vertical
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 0 && (
            <>
              {/* Section 1: Profile Hero */}
              <div className="bg-white rounded-xl border border-border p-4 lg:p-6">
                <div className="flex items-center gap-3 lg:gap-5">
                  <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-primary text-white flex items-center justify-center text-lg lg:text-2xl font-bold flex-shrink-0">
                    {user?.full_name ? getInitials(user.full_name) : 'U'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg lg:text-xl font-bold text-text-primary truncate">
                      {user?.full_name || 'User'}
                    </h2>
                    <p className="text-text-muted text-sm mt-0.5">{user?.email}</p>
                    {user?.role && (
                      <span className="inline-block mt-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs capitalize font-medium">
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Personal Information */}
              <div className="bg-white rounded-xl border border-border p-4 lg:p-6 space-y-6">
                <h2 className="text-lg font-semibold text-text-primary">Personal Information</h2>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Full Name
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Email
                    </label>
                    <input value={user?.email || ''} disabled className={disabledInputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Role
                    </label>
                    <input
                      value={user?.role || ''}
                      disabled
                      className={cn(disabledInputClass, 'capitalize')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Organization
                    </label>
                    <input
                      value={user?.organization?.name || 'No organization'}
                      disabled
                      className={disabledInputClass}
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Section 3: Change Password */}
              <div className="bg-white rounded-xl border border-border p-4 lg:p-6 space-y-6">
                <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-text-muted mt-1">Minimum 8 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Section 4: Organization Info */}
              <div className="bg-white rounded-xl border border-border p-4 lg:p-6 space-y-6">
                <h2 className="text-lg font-semibold text-text-primary">Organization</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                      Company Name
                    </p>
                    <p className="text-sm font-semibold text-text-primary">
                      {user?.organization?.name || 'No organization'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                      Current Plan
                    </p>
                    <p className="text-sm font-semibold text-text-primary capitalize">
                      {user?.organization?.plan || 'Free'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Role</p>
                    <p className="text-sm font-semibold text-text-primary capitalize">
                      {user?.role || 'Member'}
                    </p>
                  </div>
                </div>

                <a
                  href="/billing"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  Manage subscription & billing
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Section 5: Danger Zone */}
              <div className="border border-danger/30 rounded-xl p-4 lg:p-6 space-y-4">
                <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
                <p className="text-sm text-text-muted">
                  Sign out of all sessions. This will invalidate your current tokens.
                </p>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-danger hover:bg-danger/90 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}

          {activeTab === 1 && (
            <RolePermissionFlow />
          )}

          {activeTab === 2 && (
            <WorkflowTemplateManager />
          )}

          {activeTab === 4 && (
            <DefectLibrary />
          )}

          {activeTab === 5 && (
            <AQLStandards />
          )}

          {activeTab === 6 && (
            <NotificationSettings />
          )}

          {activeTab === 3 && (
            <InspectionTemplateManager />
          )}
        </div>
      </div>
    </div>
  )
}
