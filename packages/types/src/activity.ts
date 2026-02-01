/**
 * Activity types
 */

export enum ActivityType {
  CASE_CREATED = 'CASE_CREATED',
  CASE_UPDATED = 'CASE_UPDATED',
  CASE_CLOSED = 'CASE_CLOSED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  CLIENT_ADDED = 'CLIENT_ADDED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  NOTE_ADDED = 'NOTE_ADDED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

export interface Activity {
  id: string;
  userId: string;
  caseId: string | null;
  type: ActivityType;
  action: string;
  description: string | null;
  metadata: any | null;
  createdAt: Date;
}

export interface ActivityWithRelations extends Activity {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  case?: {
    id: string;
    caseNumber: string;
    title: string;
  } | null;
}

export interface ActivityCreateInput {
  userId: string;
  caseId?: string;
  type: ActivityType;
  action: string;
  description?: string;
  metadata?: any;
}
