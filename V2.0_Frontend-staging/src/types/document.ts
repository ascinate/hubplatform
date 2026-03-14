export interface ManagedDocument {
  id: string
  name: string
  file: string
  file_type: string
  file_size: number
  mime_type: string
  order: string | null
  order_po_number: string
  factory: string | null
  factory_name: string
  department: string
  doc_category: string
  visibility: string
  description: string
  uploaded_by: string
  uploaded_by_name: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface DocumentAccessLog {
  id: string
  document: string
  user: string | null
  user_name: string
  user_email: string
  action: string
  ip_address: string | null
  user_agent: string
  timestamp: string
}

export interface ShareLink {
  id: string
  document: string
  document_name: string
  token: string
  created_by: string
  created_by_name: string
  recipient_email: string
  recipient_name: string
  expires_at: string
  is_revoked: boolean
  access_count: number
  max_access: number
  requires_watermark: boolean
  is_expired: boolean
  is_valid: boolean
  share_url: string
  created_at: string
}

export interface PublicShareDocument {
  id: string
  name: string
  file_type: string
  file_size: number
  mime_type: string
  department: string
  doc_category: string
  created_at: string
}

export interface PublicShareData {
  document: PublicShareDocument
  shared_by: string
  recipient_name: string
  expires_at: string
  access_count: number
  max_access: number
  requires_watermark: boolean
}

export interface DocumentStats {
  total_count: number
  total_size: number
  by_department: { department: string; count: number; size: number }[]
  by_category: { doc_category: string; count: number }[]
  by_file_type: { file_type: string; count: number }[]
}

export const DEPARTMENTS = [
  { value: 'design', label: 'Design' },
  { value: 'sampling', label: 'Sampling' },
  { value: 'costing', label: 'Costing' },
  { value: 'production', label: 'Production' },
  { value: 'quality', label: 'Quality' },
  { value: 'packing', label: 'Packing' },
  { value: 'lab_testing', label: 'Lab Testing' },
  { value: 'logistics', label: 'Logistics' },
] as const

export const DOC_CATEGORIES = [
  { value: 'tech_pack', label: 'Tech Pack' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'shipping_doc', label: 'Shipping Document' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'inspection_report', label: 'Inspection Report' },
  { value: 'sample_photo', label: 'Sample Photo' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'defect_photo', label: 'Defect Photo' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'sop', label: 'SOP' },
  { value: 'other', label: 'Other' },
] as const

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Only Me' },
  { value: 'team', label: 'My Organization' },
  { value: 'brand', label: 'Brand Can See' },
  { value: 'shared', label: 'Via Link' },
] as const

export const DEPT_ICONS: Record<string, string> = {
  design: '🎨',
  sampling: '✂️',
  costing: '💰',
  production: '⚙️',
  quality: '🔬',
  packing: '📦',
  lab_testing: '🧪',
  logistics: '🚢',
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileTypeColor(type: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    pdf: { bg: 'bg-red-50', text: 'text-red-600' },
    xlsx: { bg: 'bg-green-50', text: 'text-green-700' },
    xls: { bg: 'bg-green-50', text: 'text-green-700' },
    csv: { bg: 'bg-green-50', text: 'text-green-700' },
    docx: { bg: 'bg-blue-50', text: 'text-blue-700' },
    doc: { bg: 'bg-blue-50', text: 'text-blue-700' },
    pptx: { bg: 'bg-orange-50', text: 'text-orange-700' },
    ppt: { bg: 'bg-orange-50', text: 'text-orange-700' },
    png: { bg: 'bg-purple-50', text: 'text-purple-700' },
    jpg: { bg: 'bg-purple-50', text: 'text-purple-700' },
    jpeg: { bg: 'bg-purple-50', text: 'text-purple-700' },
    gif: { bg: 'bg-purple-50', text: 'text-purple-700' },
    zip: { bg: 'bg-amber-50', text: 'text-amber-700' },
    rar: { bg: 'bg-amber-50', text: 'text-amber-700' },
  }
  return colors[type] || { bg: 'bg-gray-50', text: 'text-gray-600' }
}
