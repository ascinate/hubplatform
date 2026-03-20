'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Upload } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

const COUNTRY_OPTIONS = [
  'India', 'China', 'Bangladesh', 'Vietnam', 'Cambodia',
  'Indonesia', 'Pakistan', 'Sri Lanka', 'Turkey', 'Other',
]

interface Factory {
  id: string
  name: string
  location: string
  city: string
  country: string
  certifications: string
  audit_compliance: string
  last_audit_date: string
  production_capacity: number | null
  total_manpower: number | null
  infrastructure: string
  contact_person: string
  contact_email: string
  contact_phone: string
  is_active: boolean
  factory_image?: string
}

interface FactoryModalProps {
  open: boolean
  onClose: () => void
  factory: Factory | null
  onSaved: () => void
}

export default function FactoryModal({ open, onClose, factory, onSaved }: FactoryModalProps) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [certifications, setCertifications] = useState('')
  const [auditCompliance, setAuditCompliance] = useState('')
  const [lastAuditDate, setLastAuditDate] = useState('')
  const [productionCapacity, setProductionCapacity] = useState('')
  const [totalManpower, setTotalManpower] = useState('')
  const [infrastructure, setInfrastructure] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!factory

  useEffect(() => {
    if (factory) {
      setName(factory.name || '')
      setCity(factory.city || '')
      setCountry(factory.country || '')
      setCertifications(factory.certifications || '')
      setAuditCompliance(factory.audit_compliance || '')
      setLastAuditDate(factory.last_audit_date || '')
      setProductionCapacity(factory.production_capacity != null ? String(factory.production_capacity) : '')
      setTotalManpower(factory.total_manpower != null ? String(factory.total_manpower) : '')
      setInfrastructure(factory.infrastructure || '')
      setContactPerson(factory.contact_person || '')
      setContactEmail(factory.contact_email || '')
      setContactPhone(factory.contact_phone || '')
      setIsActive(factory.is_active)
      setImagePreview(factory.factory_image || null)
      setImage(null)
    } else {
      setName('')
      setCity('')
      setCountry('')
      setCertifications('')
      setAuditCompliance('')
      setLastAuditDate('')
      setProductionCapacity('')
      setTotalManpower('')
      setInfrastructure('')
      setContactPerson('')
      setContactEmail('')
      setContactPhone('')
      setIsActive(true)
      setImage(null)
      setImagePreview(null)
    }
  }, [factory])

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Factory name is required')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        city: city.trim(),
        country: country.trim(),
        certifications: certifications.trim(),
        audit_compliance: auditCompliance,
        infrastructure: infrastructure.trim(),
        contact_person: contactPerson.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        is_active: isActive,
      }
      if (lastAuditDate) payload.last_audit_date = lastAuditDate
      if (productionCapacity) payload.production_capacity = parseInt(productionCapacity)
      if (totalManpower) payload.total_manpower = parseInt(totalManpower)

      let res
      if (image) {
        const formData = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, String(value))
        })
        formData.append('factory_image', image)
        
        if (isEdit) {
          res = await api.patch(`/factories/${factory.id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } else {
          res = await api.post('/factories/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }
      } else {
        if (isEdit) {
          res = await api.patch(`/factories/${factory.id}/`, payload)
        } else {
          res = await api.post('/factories/', payload)
        }
      }

      onSaved()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} factory`)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const labelClass = 'block text-xs font-medium text-text-muted mb-1.5'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit ? 'Edit Factory' : 'Add Factory'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Factory Name */}
          <div>
            <label className={labelClass}>Factory Name <span className="text-danger">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter factory name"
              required
              autoFocus
              className={inputClass}
            />
          </div>

          {/* Factory Image Drag & Drop */}
          <div>
            <label className={labelClass}>Factory Image</label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer group"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageSelect(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative inline-block group/preview">
                  <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain border border-border" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full shadow-lg hover:bg-danger/90 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <Upload size={24} className="mx-auto text-text-muted group-hover:text-primary transition-colors" />
                  <p className="text-xs text-text-muted">
                    Drag & drop or <span className="text-primary font-medium">browse</span> factory image
                  </p>
                  <p className="text-[10px] text-text-muted/60 italic">Supports: JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
              />
            </div>
          </div>

          {/* City + Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Tirupur"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`${inputClass} bg-white appearance-none pr-10`}
                >
                  <option value="">Select Country</option>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <label className={labelClass}>Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Full name"
              className={inputClass}
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 9876543210"
              className={inputClass}
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className={labelClass}>Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="email@example.com"
              className={inputClass}
            />
          </div>

          {/* Additional Info Section */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Additional Info (Optional)</p>

            <div className="space-y-4">
              {/* Certifications */}
              <div>
                <label className={labelClass}>Certifications</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="e.g., ISO 9001, OEKO-TEX, WRAP"
                  className={inputClass}
                />
              </div>

              {/* Audit Compliance + Last Audit Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Audit Compliance</label>
                  <div className="relative">
                    <select
                      value={auditCompliance}
                      onChange={(e) => setAuditCompliance(e.target.value)}
                      className={`${inputClass} bg-white appearance-none pr-10`}
                    >
                      <option value="">Select Status</option>
                      <option value="compliant">Compliant</option>
                      <option value="non_compliant">Non-Compliant</option>
                      <option value="pending">Pending</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Last Audit Date</label>
                  <input
                    type="date"
                    value={lastAuditDate}
                    onChange={(e) => setLastAuditDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Production Capacity + Total Manpower */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Production Capacity (units/month)</label>
                  <input
                    type="number"
                    value={productionCapacity}
                    onChange={(e) => setProductionCapacity(e.target.value)}
                    placeholder="e.g., 50000"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Total Manpower (headcount)</label>
                  <input
                    type="number"
                    value={totalManpower}
                    onChange={(e) => setTotalManpower(e.target.value)}
                    placeholder="e.g., 500"
                    min="0"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Infrastructure */}
              <div>
                <label className={labelClass}>Infrastructure</label>
                <input
                  type="text"
                  value={infrastructure}
                  onChange={(e) => setInfrastructure(e.target.value)}
                  placeholder="e.g., Cutting, Sewing, Finishing, Washing"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-1">
            <label className="text-xs font-medium text-text-muted">Active Status</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isActive ? 'bg-success' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border text-text-muted rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Factory' : 'Add Factory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
