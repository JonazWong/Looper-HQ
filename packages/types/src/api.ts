/**
 * API request/response types
 */

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Search
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters?: any;
}

// Statistics
export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalClients: number;
  pendingInvoices: number;
  totalRevenue: number;
  recentActivities: any[];
}

export interface CaseStats {
  totalCases: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  recentCases: number;
}

// File upload
export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

// Authentication
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
