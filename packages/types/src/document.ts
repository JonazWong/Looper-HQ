/**
 * Document types
 */

export enum DocumentCategory {
  CONTRACT = 'CONTRACT',
  EVIDENCE = 'EVIDENCE',
  COURT_FILING = 'COURT_FILING',
  CORRESPONDENCE = 'CORRESPONDENCE',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER',
}

export interface Document {
  id: string;
  caseId: string | null;
  uploadedById: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  category: DocumentCategory;
  description: string | null;
  isConfidential: boolean;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface DocumentWithRelations extends Document {
  case?: {
    id: string;
    caseNumber: string;
    title: string;
  } | null;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface DocumentCreateInput {
  caseId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  category: DocumentCategory;
  description?: string;
  isConfidential?: boolean;
}

export interface DocumentUpdateInput {
  category?: DocumentCategory;
  description?: string;
  isConfidential?: boolean;
}
