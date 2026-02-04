/**
 * Client types
 */

export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

export enum MembershipTierEnum {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  PREMIER = 'PREMIER',
}

export interface Client {
  id: string;
  userId: string | null;
  type: ClientType;
  fullName: string;
  companyName: string | null;
  idNumber: string | null;
  businessReg: string | null;
  email: string;
  phone: string;
  address: string | null;
  membershipTier: MembershipTierEnum;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientCreateInput {
  type: ClientType;
  fullName: string;
  companyName?: string;
  idNumber?: string;
  businessReg?: string;
  email: string;
  phone: string;
  address?: string;
  membershipTier?: MembershipTierEnum;
}

export interface ClientUpdateInput {
  fullName?: string;
  companyName?: string;
  idNumber?: string;
  businessReg?: string;
  email?: string;
  phone?: string;
  address?: string;
  membershipTier?: MembershipTierEnum;
}
