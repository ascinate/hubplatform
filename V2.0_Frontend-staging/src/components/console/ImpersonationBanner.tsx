'use client'

import { useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { useImpersonation } from '@/lib/useImpersonation'

export default function ImpersonationBanner() {
  const { isImpersonating, getImpersonatedUser, endImpersonation } = useImpersonation()
  const [show, setShow] = useState(false)
  const [impUser, setImpUser] = useState<{ email: string; full_name: string; organization?: { name: string } | null } | null>(null)

  useEffect(() => {
    if (isImpersonating()) {
      setShow(true)
      setImpUser(getImpersonatedUser())
    } else {
      setShow(false)
    }
  }, [])

  if (!show || !impUser) return null

  const displayName = impUser.full_name || impUser.email
  const orgName = impUser.organization?.name

  return (
    <div className="bg-amber-500 text-white text-sm flex items-center justify-between px-4 lg:px-6 py-2 flex-shrink-0 z-50">
      <div className="flex items-center gap-2">
        <Eye size={16} />
        <span className="font-medium">
          Viewing as {displayName}
          {orgName && <span className="opacity-80"> ({orgName})</span>}
        </span>
      </div>
      <button
        onClick={endImpersonation}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-semibold transition-colors"
      >
        <X size={14} />
        Exit
      </button>
    </div>
  )
}
