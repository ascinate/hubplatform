export type RoleKey = 'brand' | 'factory' | 'thirdParty' | 'admin'
export type PermissionLevel = 'L1' | 'L2' | 'L3' | 'L4'

export interface StagePermission {
  level: PermissionLevel
  label: string
}

export interface Stage {
  id: string
  name: string
  subLabel: string
  permissions: Record<RoleKey, StagePermission>
}

export interface Phase {
  id: number
  title: string
  description: string
  highlights: string[]
  stages: Stage[]
}

export interface Role {
  key: RoleKey
  label: string
  emoji: string
  color: string
}

export interface PermissionLevelInfo {
  level: PermissionLevel
  label: string
  description: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
}

export const ROLES: Role[] = [
  { key: 'brand', label: 'Brand', emoji: '🏷', color: '#f59e0b' },
  { key: 'factory', label: 'Factory', emoji: '🏭', color: '#0ea5e9' },
  { key: 'thirdParty', label: '3rd Party', emoji: '🔬', color: '#16a34a' },
  { key: 'admin', label: 'Owner / Admin', emoji: '👑', color: '#8b5cf6' },
]

export const PERMISSION_LEVELS: PermissionLevelInfo[] = [
  {
    level: 'L4',
    label: 'Full Control & Override',
    description: 'Override any decision, authorize access, final sign-off, escalate',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-600',
    badgeBorder: 'border-red-200',
  },
  {
    level: 'L3',
    label: 'Approve / Reject / Certify',
    description: 'Approve/reject milestones, certify, raise NCR, accept orders',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  {
    level: 'L2',
    label: 'Submit / Update / Notify',
    description: 'Submit docs, update status, notify stakeholders, inline QC',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-600',
    badgeBorder: 'border-blue-200',
  },
  {
    level: 'L1',
    label: 'View / Track Only',
    description: 'Read-only, download docs, receive notifications',
    badgeBg: 'bg-gray-50',
    badgeText: 'text-gray-500',
    badgeBorder: 'border-gray-200',
  },
]

export function getLevelInfo(level: PermissionLevel): PermissionLevelInfo {
  return PERMISSION_LEVELS.find((l) => l.level === level)!
}

export const PHASES: Phase[] = [
  {
    id: 1,
    title: 'Pre-Production Samples & Lab Testing',
    description: 'All sample development and laboratory testing stages before production begins.',
    highlights: [
      'Brand holds final approval authority on all samples',
      '3rd Party lab certifies all compliance and test results',
      'Owner/Admin can override or waive any sample rejection',
    ],
    stages: [
      {
        id: 'S-01',
        name: 'Development Samples',
        subLabel: 'Proto / Initial Dev',
        permissions: {
          brand: { level: 'L3', label: 'Approve / Reject / Comment' },
          factory: { level: 'L2', label: 'Submit Sample + Docs' },
          thirdParty: { level: 'L2', label: 'Review & Report' },
          admin: { level: 'L4', label: 'Override / Final Auth' },
        },
      },
      {
        id: 'S-02',
        name: 'Size Set Samples',
        subLabel: 'Full Size Run',
        permissions: {
          brand: { level: 'L3', label: 'Approve / Reject / Grade Check' },
          factory: { level: 'L2', label: 'Submit Full Set' },
          thirdParty: { level: 'L2', label: 'Measure & Report' },
          admin: { level: 'L4', label: 'Override / Final Auth' },
        },
      },
      {
        id: 'S-03',
        name: 'Pre-Production (PP) Samples',
        subLabel: 'Production-Intent Sample',
        permissions: {
          brand: { level: 'L3', label: 'Approve / Reject' },
          factory: { level: 'L2', label: 'Submit PP Sample' },
          thirdParty: { level: 'L3', label: 'Co-Approve / Witness' },
          admin: { level: 'L4', label: 'Override / Escalate' },
        },
      },
      {
        id: 'S-04',
        name: 'Lab Tests',
        subLabel: 'Physical / Chemical / Safety',
        permissions: {
          brand: { level: 'L3', label: 'Approve / Raise TDR' },
          factory: { level: 'L1', label: 'View Results' },
          thirdParty: { level: 'L3', label: 'Conduct & Certify' },
          admin: { level: 'L4', label: 'Override / Waiver Auth' },
        },
      },
    ],
  },
  {
    id: 2,
    title: 'Order Placement & Acceptance',
    description: 'From PO issuance through factory order confirmation.',
    highlights: [
      'Brand exclusively raises and authorizes the Purchase Order',
      'Factory holds the right to Accept, Reject, or Negotiate',
      'Admin can override factory acceptance decisions',
    ],
    stages: [
      {
        id: 'S-05',
        name: 'PO Raised',
        subLabel: 'Purchase Order Issued',
        permissions: {
          brand: { level: 'L3', label: 'Issue & Authorize PO' },
          factory: { level: 'L1', label: 'View & Download' },
          thirdParty: { level: 'L1', label: 'View Only' },
          admin: { level: 'L4', label: 'Authorize / Amend PO' },
        },
      },
      {
        id: 'S-06',
        name: 'Order Acceptance by Factory',
        subLabel: 'Factory Confirmation',
        permissions: {
          brand: { level: 'L2', label: 'Notified / Acknowledge' },
          factory: { level: 'L3', label: 'Accept / Reject / Negotiate' },
          thirdParty: { level: 'L1', label: 'View Only' },
          admin: { level: 'L4', label: 'Override / Escalate' },
        },
      },
    ],
  },
  {
    id: 3,
    title: 'Production Execution',
    description: 'All factory floor execution stages from material ordering through packing completion.',
    highlights: [
      'Factory drives and updates all production stages',
      '3rd Party conducts inline QC audits at sewing and packing',
      'Brand receives automated notifications at key milestones',
      'Admin tracks all stages with override capability',
    ],
    stages: [
      {
        id: 'P-01',
        name: 'Material Ordered',
        subLabel: 'Fabric / Trim PO',
        permissions: {
          brand: { level: 'L2', label: 'Notified' },
          factory: { level: 'L3', label: 'Create & Confirm Order' },
          thirdParty: { level: 'L1', label: 'View Only' },
          admin: { level: 'L4', label: 'Track / Override' },
        },
      },
      {
        id: 'P-02',
        name: 'Material In Transit',
        subLabel: 'Supplier → Factory',
        permissions: {
          brand: { level: 'L1', label: 'View Status' },
          factory: { level: 'L3', label: 'Update ETA / Tracking' },
          thirdParty: { level: 'L1', label: 'View Only' },
          admin: { level: 'L4', label: 'Track / Alert' },
        },
      },
      {
        id: 'P-03',
        name: 'Material In Factory',
        subLabel: 'Received & Checked',
        permissions: {
          brand: { level: 'L2', label: 'Notified' },
          factory: { level: 'L3', label: 'GRN + QC Check' },
          thirdParty: { level: 'L2', label: 'Fabric Inspection' },
          admin: { level: 'L4', label: 'Track / Override' },
        },
      },
      {
        id: 'P-04',
        name: 'Cutting Started',
        subLabel: 'Cut Order Released',
        permissions: {
          brand: { level: 'L2', label: 'Notified' },
          factory: { level: 'L3', label: 'Update Status' },
          thirdParty: { level: 'L2', label: 'Inline Monitor' },
          admin: { level: 'L4', label: 'Track / Override' },
        },
      },
      {
        id: 'P-05',
        name: 'Sewing / Stitching Started',
        subLabel: 'Line Loading',
        permissions: {
          brand: { level: 'L2', label: 'Notified' },
          factory: { level: 'L3', label: 'Update Status + Output' },
          thirdParty: { level: 'L2', label: 'Inline QC Audit' },
          admin: { level: 'L4', label: 'Track / Override' },
        },
      },
      {
        id: 'P-06',
        name: 'Assembly Started',
        subLabel: 'Sub-Assembly / Embroidery / Print',
        permissions: {
          brand: { level: 'L2', label: 'Notified' },
          factory: { level: 'L3', label: 'Update Status' },
          thirdParty: { level: 'L2', label: 'Mid-Line Check' },
          admin: { level: 'L4', label: 'Track / Override' },
        },
      },
      {
        id: 'P-07',
        name: 'Packing Started',
        subLabel: 'Folding / Poly / Carton',
        permissions: {
          brand: { level: 'L2', label: 'Notified' },
          factory: { level: 'L3', label: 'Update + Pack List' },
          thirdParty: { level: 'L2', label: 'Carton / Packing Audit' },
          admin: { level: 'L4', label: 'Track / Override' },
        },
      },
    ],
  },
  {
    id: 4,
    title: 'Final Inspection & Shipment',
    description: 'From inspection request through in-transit delivery to buyer warehouse.',
    highlights: [
      '3rd Party must issue a Release Certificate before dispatch',
      'Brand approves all dispatch authorizations',
      'Admin can place a shipment hold at any point',
      'Both Sea and Air shipment modes are tracked',
    ],
    stages: [
      {
        id: 'S-07',
        name: 'Ready for Inspection',
        subLabel: 'Final Inspection Request',
        permissions: {
          brand: { level: 'L2', label: 'Notified + Book Date' },
          factory: { level: 'L3', label: 'Trigger Inspection Request' },
          thirdParty: { level: 'L3', label: 'Schedule & Confirm Date' },
          admin: { level: 'L4', label: 'Authorize / Reassign' },
        },
      },
      {
        id: 'S-08',
        name: 'Ready for Dispatch',
        subLabel: 'Post-Inspection Pass',
        permissions: {
          brand: { level: 'L3', label: 'Approve Dispatch' },
          factory: { level: 'L2', label: 'Notify + Prepare Docs' },
          thirdParty: { level: 'L3', label: 'Issue Release Certificate' },
          admin: { level: 'L4', label: 'Authorize / Hold' },
        },
      },
      {
        id: 'S-09',
        name: 'Dispatched',
        subLabel: 'Ex-Factory Gate',
        permissions: {
          brand: { level: 'L2', label: 'Notified' },
          factory: { level: 'L3', label: 'Upload Dispatch Docs' },
          thirdParty: { level: 'L2', label: 'Verify Dispatch' },
          admin: { level: 'L4', label: 'Track' },
        },
      },
      {
        id: 'S-10a',
        name: 'In Transit — By Sea',
        subLabel: 'FCL / LCL',
        permissions: {
          brand: { level: 'L2', label: 'Track Vessel / ETA' },
          factory: { level: 'L2', label: 'Share BL / Docs' },
          thirdParty: { level: 'L1', label: 'View Only' },
          admin: { level: 'L4', label: 'Track / Alert' },
        },
      },
      {
        id: 'S-10b',
        name: 'In Transit — By Air',
        subLabel: 'AWB',
        permissions: {
          brand: { level: 'L2', label: 'Track AWB / ETA' },
          factory: { level: 'L2', label: 'Share AWB / Docs' },
          thirdParty: { level: 'L1', label: 'View Only' },
          admin: { level: 'L4', label: 'Track / Alert' },
        },
      },
    ],
  },
  {
    id: 5,
    title: 'Warehouse QC & Post-Delivery Actions',
    description: 'Destination quality control, complaint handling, and financial claims resolution.',
    highlights: [
      'Brand leads all warehouse findings and NCR raising',
      'Factory must respond with Corrective Action Reports (CAR)',
      'Admin holds final arbitration authority on all claims',
      '3rd Party provides independent technical assessment for disputes',
    ],
    stages: [
      {
        id: 'W-01',
        name: 'Warehouse Inspections',
        subLabel: 'Receiving QC Check',
        permissions: {
          brand: { level: 'L3', label: 'Review Report / Decision' },
          factory: { level: 'L1', label: 'Notified Only' },
          thirdParty: { level: 'L3', label: 'Conduct & Report' },
          admin: { level: 'L4', label: 'Authorize / Override' },
        },
      },
      {
        id: 'W-02',
        name: 'Finding in Warehouse',
        subLabel: 'Defect / Non-Conformance',
        permissions: {
          brand: { level: 'L3', label: 'Raise NCR / Decision' },
          factory: { level: 'L2', label: 'Respond / Submit CAR' },
          thirdParty: { level: 'L3', label: 'Document & Report' },
          admin: { level: 'L4', label: 'Resolve / Escalate' },
        },
      },
      {
        id: 'W-03',
        name: 'Complaints',
        subLabel: 'Consumer / Retail Feedback',
        permissions: {
          brand: { level: 'L3', label: 'Raise & Manage' },
          factory: { level: 'L3', label: 'Respond + Root Cause' },
          thirdParty: { level: 'L2', label: 'Technical Assessment' },
          admin: { level: 'L4', label: 'Arbitrate / Close' },
        },
      },
      {
        id: 'W-04',
        name: 'Claims',
        subLabel: 'Financial / Return Claim',
        permissions: {
          brand: { level: 'L3', label: 'Raise & Submit Claim' },
          factory: { level: 'L3', label: 'Dispute / Counter' },
          thirdParty: { level: 'L2', label: 'Provide Evidence' },
          admin: { level: 'L4', label: 'Final Decision / Close' },
        },
      },
    ],
  },
]
