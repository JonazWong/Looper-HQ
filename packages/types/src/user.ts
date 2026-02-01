/**
 * User types
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  LAWYER = 'LAWYER',
  CLIENT = 'CLIENT',
  STAFF = 'STAFF',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  keycloakId: string | null;
  avatar: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  name?: string;
  role?: UserRole;
  phone?: string;
  keycloakId?: string;
}

export interface UserUpdateInput {
  name?: string;
  phone?: string;
  avatar?: string;
}
