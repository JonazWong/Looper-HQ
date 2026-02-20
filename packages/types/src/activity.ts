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
  activityType: ActivityType; // Renamed from 'type' to avoid Python/SQLAlchemy conflict
  action: string;
  description: string | null;
  metaData: any | null; // Renamed from 'metadata' to avoid SQLAlchemy conflict
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
  activityType: ActivityType; // Renamed from 'type'
  action: string;
  description?: string;
  metaData?: any; // Renamed from 'metadata'
}
