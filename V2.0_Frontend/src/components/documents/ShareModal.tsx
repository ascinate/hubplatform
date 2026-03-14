'use client'

import { useState, useEffect } from 'react'
import { X, Link2, Copy, Check, Mail, Shield, Clock, Eye, Ban, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { ManagedDocument, ShareLink } from '@/types/document'

interface ShareModalProps {
  doc: ManagedDocument
  onClose: () => void
}

export default function ShareModal({ doc, onClose }: ShareModalProps) {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Create form
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [expiresHours, setExpiresHours] = useState(72)
  const [maxAccess, setMaxAccess] = useState(10)
  const [requiresWatermark, setRequiresWatermark] = useState(false)
  const [sendEmail, setSendEmail] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await api.get(`/documents/${doc.id}/share/`)
      setLinks(res.data)
    } catch {
      // May fail for non-admin non-uploader, that's OK
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await api.post(`/documents/${doc.id}/share/`, {
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        expires_hours: expiresHours,
        max_access: maxAccess,
        requires_watermark: requiresWatermark,
        send_email: sendEmail && !!recipientEmail,
      })
      setLinks(prev => [res.data, ...prev])
      toast.success('Share link created')
      setShowForm(false)
      setRecipientEmail('')
      setRecipientName('')

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(res.data.share_url)
      setCopiedId(res.data.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (linkId: string) => {
    try {
      await api.patch(`/documents/shares/${linkId}/revoke/`)
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, is_revoked: true, is_valid: false } : l))
      toast.success('Share link revoked')
    } catch {
      toast.error('Failed to revoke link')
    }
  }

  const copyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const formatExpiry = (dt: string) => {
    const d = new Date(dt)
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / 3600000)
    if (hours < 24) return `${hours}h remaining`
    return `${Math.floor(hours / 24)}d remaining`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Share Document</h2>
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-[300px]">{doc.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Create new link */}
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#C9A96E] hover:bg-[#b89555] text-white rounded-xl text-sm font-medium transition-colors">
              <Link2 size={16} /> Create Share Link
            </button>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">New Share Link</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Recipient Name</label>
                  <input value={recipientName} onChange={e => setRecipientName(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Recipient Email</label>
                  <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="Optional" type="email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Expires In</label>
                  <select value={expiresHours} onChange={e => setExpiresHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40">
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>7 days</option>
                    <option value={336}>14 days</option>
                    <option value={720}>30 days</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Max Views</label>
                  <select value={maxAccess} onChange={e => setMaxAccess(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40">
                    <option value={5}>5 views</option>
                    <option value={10}>10 views</option>
                    <option value={25}>25 views</option>
                    <option value={50}>50 views</option>
                    <option value={100}>100 views</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input type="checkbox" checked={requiresWatermark} onChange={e => setRequiresWatermark(e.target.checked)}
                    className="rounded border-gray-300 text-[#C9A96E] focus:ring-[#C9A96E]" />
                  <Shield size={14} className="text-text-muted" />
                  Watermark
                </label>
                {recipientEmail && (
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)}
                      className="rounded border-gray-300 text-[#C9A96E] focus:ring-[#C9A96E]" />
                    <Mail size={14} className="text-text-muted" />
                    Send email
                  </label>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleCreate} disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#C9A96E] hover:bg-[#b89555] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create & Copy Link'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing links */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">
              {loading ? 'Loading...' : `Share Links (${links.length})`}
            </h3>

            {!loading && links.length === 0 && (
              <p className="text-xs text-text-muted py-4 text-center">No share links created yet</p>
            )}

            {links.map(link => (
              <div key={link.id} className={`border rounded-xl p-3 ${link.is_valid ? 'border-border bg-white' : 'border-red-100 bg-red-50/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {link.recipient_name && (
                      <p className="text-sm font-medium text-text-primary">{link.recipient_name}</p>
                    )}
                    {link.recipient_email && (
                      <p className="text-xs text-text-muted">{link.recipient_email}</p>
                    )}
                    {!link.recipient_name && !link.recipient_email && (
                      <p className="text-sm text-text-muted">Anyone with link</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {link.is_valid && (
                      <>
                        <button onClick={() => copyLink(link.share_url, link.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Copy link">
                          {copiedId === link.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-text-muted" />}
                        </button>
                        <a href={link.share_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Open link">
                          <ExternalLink size={14} className="text-text-muted" />
                        </a>
                        <button onClick={() => handleRevoke(link.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Revoke">
                          <Ban size={14} className="text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {link.is_expired ? <span className="text-red-500">Expired</span> : formatExpiry(link.expires_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={10} />
                    {link.access_count}/{link.max_access} views
                  </span>
                  {link.requires_watermark && (
                    <span className="flex items-center gap-1">
                      <Shield size={10} /> Watermarked
                    </span>
                  )}
                  {link.is_revoked && (
                    <span className="text-red-500 font-medium">Revoked</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
