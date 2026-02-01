/**
 * Shared types for Looper HQ
 */

// Export all type modules
export * from './user';
export * from './case';
export * from './client';
export * from './document';
export * from './activity';
export * from './billing';
export * from './membership';
export * from './api';

// Legacy enums for backward compatibility
export enum Role {
  USER = 'USER',
  STAFF = 'STAFF',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum MembershipTier {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum CaseStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}
