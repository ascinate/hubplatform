'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Upload } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface Factory {
  id: string
  name: string
  location: string
}

export default function EditOrderPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [factories, setFactories] = useState<Factory[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orderImage, setOrderImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    po_number: '',
    product_name: '',
    color: '',
    gender: '',
    factory: '',
    quantity: '',
    due_date: '',
    status: 'in_progress',
    description: '',
    notes: '',
    country: '',
    master_order: '',
  })

  useEffect(() => {
    loadFactories()
    loadOrder()
  }, [])

  const loadFactories = async () => {
    try {
      const { data } = await api.get('/factories/', { params: { is_active: true } })
      setFactories(data.results || data)
    } catch {
      // Will show empty dropdown
    }
  }

  const loadOrder = async () => {
    try {
      const { data } = await api.get(`/production-orders/${id}/`)
      setForm({
        po_number: data.po_number || '',
        product_name: data.product_name || '',
        color: data.color || '',
        gender: data.gender || '',
        factory: data.factory || '',
        quantity: data.quantity ? String(data.quantity) : '',
        due_date: data.due_date || '',
        status: data.status || 'in_progress',
        description: data.description || '',
        notes: data.notes || '',
        country: data.country || '',
        master_order: data.master_order || '',
      })
      if (data.order_image_url) {
        setImagePreview(data.order_image_url)
      }
    } catch {
      toast.error('Failed to load order')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setOrderImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!form.po_number || !form.product_name) {
      toast.error('Order No. and Product Name are required')
      return
    }

    setSaving(true)
    try {
      if (orderImage) {
        const formData = new FormData()
        formData.append('po_number', form.po_number)
        formData.append('product_name', form.product_name)
        if (form.color) formData.append('color', form.color)
        if (form.gender) formData.append('gender', form.gender)
        formData.append('quantity', String(parseInt(form.quantity) || 0))
        formData.append('status', form.status)
        if (form.notes) formData.append('notes', form.notes)
        if (form.factory) formData.append('factory', form.factory)
        if (form.due_date) formData.append('due_date', form.due_date)
        if (form.description) formData.append('description', form.description)
        formData.append('order_image', orderImage)
        await api.patch(`/production-orders/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        const payload: Record<string, unknown> = {
          po_number: form.po_number,
          product_name: form.product_name,
          quantity: parseInt(form.quantity) || 0,
          status: form.status,
          notes: form.notes,
        }
        if (form.color) payload.color = form.color
        if (form.gender) payload.gender = form.gender
        if (form.factory) payload.factory = form.factory
        if (form.due_date) payload.due_date = form.due_date
        if (form.description) payload.description = form.description
        await api.patch(`/production-orders/${id}/`, payload)
      }

      toast.success('Order updated')
      router.push('/orders')
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const firstError = error.response?.data
        ? Object.values(error.response.data)[0]?.[0]
        : 'Failed to update order'
      toast.error(firstError as string)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push('/orders')}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Edit Order</h1>
      </div>

      {/* Form content */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Order No. <span className="text-danger">*</span>
              </label>
              <input
                name="po_number"
                value={form.po_number}
                onChange={handleChange}
                placeholder="e.g., PO_TSHIRT_1234"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Product Name <span className="text-danger">*</span>
              </label>
              <input
                name="product_name"
                value={form.product_name}
                onChange={handleChange}
                placeholder="e.g., Cotton T-Shirt Black"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Color <span className="text-danger">*</span>
              </label>
              <input
                name="color"
                value={form.color}
                onChange={handleChange}
                required
                placeholder="e.g., Black, Red, Navy Blue"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Gender / Category <span className="text-danger">*</span>
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                <option value="">Select Gender / Category</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Factory</label>
              <select
                name="factory"
                value={form.factory}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                <option value="">Select Factory</option>
                {factories.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.location ? `— ${f.location}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Quantity
              </label>
              <input
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g., 8000"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Delivery Date
              </label>
              <input
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Order Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload size={24} className="mx-auto text-text-muted mb-2" />
                    <p className="text-sm text-text-muted">Click to upload image</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Order Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Order description..."
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.push('/orders')}
          className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-text-muted hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
