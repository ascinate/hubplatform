export type TaskStatus   = 'open' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType     = 'inspection' | 'lab_test' | 'audit' | 'document_submission' | 'follow_up' | 'other'

export interface Task {
  id:                      string
  title:                   string
  task_type:               TaskType
  task_type_display:       string
  priority:                TaskPriority
  priority_display:        string
  description:             string
  status:                  TaskStatus
  status_display:          string
  created_by:              string
  created_by_name:         string
  assigned_to:             string | null
  assigned_to_name_display: string
  assigned_to_email:       string
  assigned_to_name:        string
  order:                   string | null
  order_po_number:         string
  factory:                 string | null
  factory_name:            string
  due_date:                string
  reminder_days:           number
  notify_assignee:         boolean
  notify_creator:          boolean
  notify_on_overdue:       boolean
  cc_emails:               string[]
  attachments:             string[]
  completed_at:            string | null
  created_at:              string
  updated_at:              string
}

export interface TaskStats {
  open:        number
  in_progress: number
  overdue:     number
  completed:   number
  cancelled:   number
  total:       number
}

export interface TaskActivity {
  id:         string
  user_name:  string
  action:     string
  old_value:  string
  new_value:  string
  note:       string
  created_at: string
}

export const CAN_CREATE_TASK = ['admin', 'org_admin']

export const STATUS_COLORS: Record<TaskStatus, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed:   'bg-green-100 text-green-700',
  overdue:     'bg-red-100 text-red-700 font-bold',
  cancelled:   'bg-gray-100 text-gray-500',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    'bg-gray-400',
  medium: 'bg-blue-500',
  high:   'bg-orange-500',
  urgent: 'bg-red-500 animate-pulse',
}
