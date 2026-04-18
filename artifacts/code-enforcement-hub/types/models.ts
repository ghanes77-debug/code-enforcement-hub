export type CaseStatus = 'Open' | 'Pending' | 'Notice Sent' | 'Reinspection Needed' | 'Closed';
export type NoticeStage = 'First Notice' | 'Second Notice' | 'Final Notice';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Inspector' | 'Supervisor' | 'Staff';
  badgeNumber?: string;
  phone?: string;
  department: string;
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
}

export interface CaseNote {
  id: string;
  caseId: string;
  text: string;
  createdAt: string;
  authorName: string;
}

export interface Attachment {
  id: string;
  caseId: string;
  uri: string;
  filename: string;
  type: 'photo' | 'document';
  createdAt: string;
  caption?: string;
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
}

export interface EnforcementCase {
  id: string;
  caseNumber: string;
  openedDate: string;
  status: CaseStatus;
  propertyId: string;
  responsiblePartyId: string;
  inspectorId: string;
  violations: CaseViolation[];
  notes: CaseNote[];
  attachments: Attachment[];
  notices: Notice[];
  statusHistory: { status: CaseStatus; date: string; note?: string }[];
  closedDate?: string;
}
