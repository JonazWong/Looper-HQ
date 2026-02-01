// Case Status
export const CASE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
} as const

export type CaseStatus = typeof CASE_STATUS[keyof typeof CASE_STATUS]

// Case Priority
export const CASE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export type CasePriority = typeof CASE_PRIORITY[keyof typeof CASE_PRIORITY]

// Case Type (Hong Kong legal context)
export const CASE_TYPE = {
  CIVIL: 'civil',
  CRIMINAL: 'criminal',
  FAMILY: 'family',
  CORPORATE: 'corporate',
  PROPERTY: 'property',
  EMPLOYMENT: 'employment',
  IMMIGRATION: 'immigration',
} as const

export type CaseType = typeof CASE_TYPE[keyof typeof CASE_TYPE]

// Color mappings for case status
export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  [CASE_STATUS.OPEN]: 'case-status-open',
  [CASE_STATUS.IN_PROGRESS]: 'case-status-in-progress',
  [CASE_STATUS.CLOSED]: 'case-status-closed',
  [CASE_STATUS.ARCHIVED]: 'case-status-archived',
}

// Type definitions
export interface Case {
  id: string
  caseNumber: string
  title: string
  description: string
  status: CaseStatus
  priority: CasePriority
  type: CaseType
  clientId: string
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}
