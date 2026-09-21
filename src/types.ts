export type UserRole = 'admin' | 'user' | 'manager';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  permissions?: {
    canQuote: boolean;
    canApprove: boolean;
    canRevokeRealtime: boolean;
    canExportReports: boolean;
    canManageUsers: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type AccessType = 'RDP' | 'SSH' | 'VPN_FULL' | 'WEB_GATEWAY';
export type SecurityTier = 'STANDARD' | 'ENCRYPTED_E2E' | 'MAX_ISOLATION';
export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface AccessQuote {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  projectTitle: string;
  peopleCount: number;
  accessType: AccessType;
  durationDays: number;
  securityTier: SecurityTier;
  unitPricePerPerson: number;
  totalCost: number;
  currency: string;
  privacyTermsAccepted: boolean;
  privacyNoticeVersion: string;
  status: QuoteStatus;
  encryptedPayload: string;
  hashSignature: string;
  notes?: string;
  approvedBy?: string;
  approvalEmailSent?: boolean;
  approvalEmailDetails?: string;
  accessCredentialsEncrypted?: string;
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus = 'CONNECTED' | 'IDLE' | 'TERMINATED_BY_ADMIN';

export interface ActiveSession {
  id: string;
  quoteId: string;
  userEmail: string;
  userName: string;
  machineName: string;
  protocol: AccessType;
  ipAddressMasked: string; // e.g. 192.168.***.*** (Privacy preserving)
  status: SessionStatus;
  encryptedSessionToken: string;
  connectedAt: string;
  lastHeartbeat: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  senderRole: 'admin' | 'user' | 'support_bot';
  quoteId?: string;
  message: string;
  isEncrypted: boolean;
  createdAt: string;
}

export interface AuditLogBlock {
  id: string;
  blockIndex: number;
  action: string;
  performedBy: string;
  entityId: string;
  detailsMasked: string;
  prevBlockHash: string;
  blockHash: string;
  timestamp: string;
}

export interface ReportSummary {
  totalQuotes: number;
  totalPeopleEstimated: number;
  approvedQuotes: number;
  totalCostApproved: number;
  activeSessionsCount: number;
  securityScore: number;
  generatedAt: string;
}
