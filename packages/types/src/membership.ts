/**
 * Membership types
 */

import { MembershipTierEnum } from './client';

export interface Membership {
  id: string;
  userId: string;
  tier: MembershipTierEnum;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  searchLimit: number;
  caseLimit: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipWithUser extends Membership {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface MembershipCreateInput {
  userId: string;
  tier: MembershipTierEnum;
  startDate?: Date;
  endDate?: Date;
  searchLimit?: number;
  caseLimit?: number;
}

export interface MembershipUpdateInput {
  tier?: MembershipTierEnum;
  endDate?: Date;
  isActive?: boolean;
  searchLimit?: number;
  caseLimit?: number;
}

export interface MembershipBenefits {
  tier: MembershipTierEnum;
  searchLimit: number;
  caseLimit: number | null;
  features: string[];
  price: number;
  currency: string;
}
