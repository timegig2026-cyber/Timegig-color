export type NavTab = 'activation' | 'admin';

export type AdminSection = 'overview' | 'verification' | 'tenant-pop' | 'user-pop' | 'settings' | 'referral';

export type TenantSection = 'overview' | 'verification' | 'tenant-pop' | 'user-pop' | 'bank-transfer' | 'settings';

export interface TenantSettings {
  feeTenant: number;
  feeUser: number;
  maxTenants: number;
  maxUsers: number;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationSubmission {
  id: string;
  plan: 'tenant' | 'user';
  selfieUrl: string;
  idDocName: string;
  idDocSize: string;
  idDocUrl: string;
  submittedAt: string;
  status: VerificationStatus;
  rejectionReason?: string;
  applicantName?: string;
  applicantContact?: string;
  referralId?: string;
}

export type POPStatus = 'pending' | 'approved' | 'rejected';

export interface ManagedMember {
  id: string;
  name: string;
  contact: string;
  type: 'tenant' | 'user';
  joinedAt: string;
  status: 'active' | 'suspended';
  monthlyFee: string; // 'R299,99' or 'R29,99'
  referralCode: string;
  selfieUrl?: string;
  idDocName?: string;
  idDocSize?: string;
  idDocUrl?: string;
  verificationStatus?: VerificationStatus;
  popId?: string;
  popStatus?: POPStatus;
  popDocName?: string;
  popDocSize?: string;
  popDocUrl?: string;
  popSubmittedAt?: string;
  popApprovedAt?: string;
  popExpiresAt?: string;
  popExpiresTimestamp?: number;
  maxTenants?: number;
  maxUsers?: number;
}

export interface ProofOfPayment {
  id: string;
  type: 'tenant' | 'user'; // 'tenant' -> Tenant PoP, 'user' -> User PoP
  ref: 'Ten29' | 'User29';
  bankName: string; // Capitec
  accountName: string; // Matthews
  accountNumber: string; // 1334067366
  amount: string;
  docName: string;
  docSize: string;
  docUrl: string;
  submittedAt: string;
  status: POPStatus;
  approvedAt?: string;
  expiresAt?: string; // 30 days from approval
  expiresTimestamp?: number;
  referralId?: string;
  applicantName?: string;
  applicantContact?: string;
}
