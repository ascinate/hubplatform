'use client'

import { useState } from 'react'

const N8N_WEBHOOK_URL = "https://n8n.srv1372067.hstgr.cloud/webhook/sankalphub-feedback"

const SCREENS = [
  "Dashboard", "Orders", "Inspections", "Factories", "Lab Testing",
  "Billing", "Settings", "Analytics", "Website Analytics", "Other"
]

const ISSUE_TYPES = ["Bug", "Missing Field", "Missing Template", "Feature Request", "UX Issue", "Question"]

const ROLES = ["QA Tester", "Developer", "Manager", "Client", "Other"]

export default function StagingFeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', role: '', screen: '', issueType: '', description: ''
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.role || !form.screen || !form.issueType || !form.description) return
    setSubmitting(true)
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setOpen(false); setForm({ name: '', email: '', role: '', screen: '', issueType: '', description: '' }) }, 3000)
    } catch {
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Report a staging issue"
        style={{ zIndex: 9999 }}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        Staging Feedback
      </button>

      {/* Overlay + modal */}
      {open && (
        <div
          style={{ zIndex: 10000 }}
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest bg-orange-100 text-orange-600 px-2 py-0.5 rounded mb-1">Staging</span>
                <h2 className="text-base font-semibold text-gray-900 leading-tight">Report an Issue</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-lg">Feedback sent!</p>
                <p className="text-sm text-gray-500">Claude is triaging your report. Naveen will be notified.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Your Name *</label>
                    <input
                      value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="e.g. Ravi"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Email (optional)</label>
                    <input
                      type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="for follow-up"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Your Role *</label>
                  <select value={form.role} onChange={e => set('role', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white">
                    <option value="">Select role…</option>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Screen / Feature *</label>
                    <select value={form.screen} onChange={e => set('screen', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white">
                      <option value="">Select screen…</option>
                      {SCREENS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Issue Type *</label>
                    <select value={form.issueType} onChange={e => set('issueType', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white">
                      <option value="">Select type…</option>
                      {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Description *</label>
                  <textarea
                    value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Describe what happened, what you expected, and any steps to reproduce…"
                    rows={4}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !form.name || !form.role || !form.screen || !form.issueType || !form.description}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
                >
                  {submitting ? 'Sending…' : 'Submit Feedback'}
                </button>
                <p className="text-xs text-center text-gray-400">Auto-triaged by Claude · Logged to Google Sheets · Naveen notified</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
