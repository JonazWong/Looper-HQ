/**
 * Billing types
 */

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  caseId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceWithRelations extends Invoice {
  case: {
    id: string;
    caseNumber: string;
    title: string;
    client: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}

export interface InvoiceCreateInput {
  caseId: string;
  amount: number;
  currency?: string;
  issueDate?: Date;
  dueDate?: Date;
}

export interface InvoiceUpdateInput {
  amount?: number;
  status?: InvoiceStatus;
  dueDate?: Date;
  paidDate?: Date;
}

export interface TimeLog {
  id: string;
  caseId: string;
  description: string;
  hours: number;
  hourlyRate: number | null;
  billable: boolean;
  logDate: Date;
  createdAt: Date;
}

export interface TimeLogWithRelations extends TimeLog {
  case: {
    id: string;
    caseNumber: string;
    title: string;
  };
}

export interface TimeLogCreateInput {
  caseId: string;
  description: string;
  hours: number;
  hourlyRate?: number;
  billable?: boolean;
  logDate: Date;
}

export interface TimeLogUpdateInput {
  description?: string;
  hours?: number;
  hourlyRate?: number;
  billable?: boolean;
  logDate?: Date;
}
