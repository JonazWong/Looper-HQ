/**
 * Case types
 */

export enum CaseStatusEnum {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum CaseCategory {
  CIVIL = 'CIVIL',
  CRIMINAL = 'CRIMINAL',
  CRIMINAL_APPEAL = 'CRIMINAL_APPEAL',
  CORPORATE = 'CORPORATE',
  FAMILY = 'FAMILY',
  PROPERTY = 'PROPERTY',
  EMPLOYMENT = 'EMPLOYMENT',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  CONSTITUTIONAL = 'CONSTITUTIONAL',
  IMMIGRATION = 'IMMIGRATION',
  PERSONAL_INJURY = 'PERSONAL_INJURY',
  TORT = 'TORT',
  CONTRACT = 'CONTRACT',
  BANKRUPTCY_INSOLVENCY = 'BANKRUPTCY_INSOLVENCY',
  SECURITIES = 'SECURITIES',
  ARBITRATION = 'ARBITRATION',
  JUDICIAL_REVIEW = 'JUDICIAL_REVIEW',
  HUMAN_RIGHTS = 'HUMAN_RIGHTS',
  COMPETITION = 'COMPETITION',
  TAX = 'TAX',
  OTHER = 'OTHER',
}

export enum CourtLevel {
  CFA = 'CFA',
  CA = 'CA',
  CFI = 'CFI',
  DC = 'DC',
  FC = 'FC',
  MC = 'MC',
  LT = 'LT',
  LABOUR = 'LABOUR',
  SAR = 'SAR',
  COMPETITION = 'COMPETITION',
  OTHER = 'OTHER',
}

export interface Case {
  id: string;
  caseNumber: string;
  
  // Bilingual fields
  title_zh: string;
  title_en: string;
  description_zh: string | null;
  description_en: string | null;
  publicNote_zh: string | null;
  publicNote_en: string | null;
  
  status: CaseStatusEnum;
  priority: Priority;
  category: CaseCategory;
  clientId: string;
  lawyerId: string | null;
  startDate: Date;
  endDate: Date | null;
  courtDate: Date | null;
  estimatedValue: number | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseWithRelations extends Case {
  client: {
    id: string;
    name: string;
    email: string;
  };
  lawyer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    documents: number;
    activities: number;
    timeLogs: number;
  };
}

export interface CaseCreateInput {
  // Bilingual fields
  title_zh: string;
  title_en: string;
  description_zh?: string;
  description_en?: string;
  publicNote_zh?: string;
  publicNote_en?: string;
  
  category: CaseCategory;
  priority?: Priority;
  clientId: string;
  lawyerId?: string;
  courtDate?: Date;
  estimatedValue?: number;
  isPublic?: boolean;
}

export interface CaseUpdateInput {
  // Bilingual fields
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  publicNote_zh?: string;
  publicNote_en?: string;
  
  status?: CaseStatusEnum;
  priority?: Priority;
  category?: CaseCategory;
  lawyerId?: string;
  endDate?: Date;
  courtDate?: Date;
  estimatedValue?: number;
  isPublic?: boolean;
}

export interface CaseSearchParams {
  query?: string;
  status?: CaseStatusEnum;
  priority?: Priority;
  category?: CaseCategory;
  clientId?: string;
  lawyerId?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'startDate';
  sortOrder?: 'asc' | 'desc';
}
