export type CaseStatus = 'Open' | 'Pending' | 'Notice Sent' | 'Reinspection Needed' | 'Closed';
export type NoticeStage = 'First Notice' | 'Second Notice' | 'Final Notice';
export type CaptureMethod = 'standard' | 'drone';

export type SystemRole =
  | 'Platform Super Admin'
  | 'Municipal Admin'
  | 'Code Enforcement Officer'
  | 'Authorized Pilot'
  | 'Supervisor / Reviewer'
  | 'Read-Only Staff';

export type PermissionCategory =
  | 'caseManagement'
  | 'violations'
  | 'notices'
  | 'ordinanceLibrary'
  | 'aerialEvidence'
  | 'userAdminManagement';

export type PermissionLevel = 'none' | 'view' | 'edit' | 'admin';

export type RolePermissions = Record<PermissionCategory, PermissionLevel>;

export interface AuditActorSnapshot {
  userId: string;
  displayName: string;
}

export interface PlatformUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  username: string;
  municipality: string;
  municipalityId: string;
  department: string;
  title: string;
  role: SystemRole;
  permissionOverrides?: Partial<RolePermissions>;
  isActive: boolean;
  tdlrCeNumber?: string;
  pilotCertificationStatus: 'Not Applicable' | 'Pending' | 'Certified' | 'Expired' | 'Suspended';
  certificationId?: string;
  certificationExpirationDate?: string;
  trainingCompletionDate?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
  createdByDisplayName?: string;
  updatedByUserId?: string;
  updatedByDisplayName?: string;
}

export interface RoleDefinition {
  role: SystemRole;
  description: string;
  permissions: RolePermissions;
  updatedAt?: string;
  updatedByUserId?: string;
  updatedByDisplayName?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: 'user' | 'role';
  targetId: string;
  targetDisplayName: string;
  actorUserId: string;
  actorDisplayName: string;
  createdAt: string;
  details?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Inspector' | 'Supervisor' | 'Staff';
  badgeNumber?: string;
  phone?: string;
  department: string;
}

export type FlightAttributionMode = 'self' | 'authorized_pilot';

export interface EvidencePersonSnapshot {
  userId: string;
  municipalityId: string;
  name: string;
  email: string;
  role: string;
  badgeNumber?: string;
  phone?: string;
  department: string;
}

export interface AuthorizedPilotProfile extends EvidencePersonSnapshot {
  pilotCertificate?: string;
  approvedForAerialEvidence: boolean;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  parcelNumber?: string;
  lotNumber?: string;
  subdivision?: string;
  propertyType?: string;
  zoningCode?: string;
  createdAt: string;
}

export interface ResponsibleParty {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  relationship?: string;
}

export interface Ordinance {
  id: string;
  sectionNumber: string;
  title: string;
  category: string;
  summary: string;
  fullText: string;
}

export interface CaseViolation {
  id: string;
  caseId: string;
  ordinanceId: string;
  ordinanceSectionNumber: string;
  violationTitle: string;
  violationDescription: string;
  complianceDeadline: string;
  noticeStage: NoticeStage;
  inspectorNotes?: string;
  createdByUserId?: string;
  createdByDisplayName?: string;
  updatedByUserId?: string;
  updatedByDisplayName?: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  text: string;
  createdAt: string;
  authorName: string;
  createdByUserId?: string;
  createdByDisplayName?: string;
}

export interface Attachment {
  id: string;
  caseId: string;
  uri: string;
  filename: string;
  type: 'photo' | 'document';
  createdAt: string;
  caption?: string;
  captureMethod?: CaptureMethod;
  dateCaptured?: string;
  uploadedBy?: EvidencePersonSnapshot;
  areaObserved?: string;
  observationNotes?: string;
  linkedViolationIds?: string[];
  useInNotice?: boolean;
  recordCreatedBy?: EvidencePersonSnapshot;
  flightConductedBy?: EvidencePersonSnapshot;
  flightAttributionMode?: FlightAttributionMode;
  flightDate?: string;
  missionNotes?: string;
  createdByUserId?: string;
  createdByDisplayName?: string;
}

export interface Notice {
  id: string;
  caseId: string;
  stage: NoticeStage;
  createdAt: string;
  sentAt?: string;
  dueDate: string;
  content: string;
  violationIds: string[];
  createdByUserId?: string;
  createdByDisplayName?: string;
}

export interface EnforcementCase {
  id: string;
  caseNumber: string;
  openedDate: string;
  status: CaseStatus;
  propertyId: string;
  responsiblePartyId: string;
  inspectorId: string;
  generalNotes?: string;
  createdByUserId?: string;
  createdByDisplayName?: string;
  updatedByUserId?: string;
  updatedByDisplayName?: string;
  violations: CaseViolation[];
  notes: CaseNote[];
  attachments: Attachment[];
  notices: Notice[];
  statusHistory: {
    status: CaseStatus;
    date: string;
    note?: string;
    changedByUserId?: string;
    changedByDisplayName?: string;
  }[];
  closedDate?: string;
}
