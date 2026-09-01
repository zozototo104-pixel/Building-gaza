export interface Project {
  id: number;
  name: string;
  description?: string | null;
  startDate?: string | null;
  budget?: string | number | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
  attachmentUrl?: string | null;
  managerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMetrics extends Project {
  collected: number;
  spent: number;
  budgetNum: number;
  remainingToCollect: number;
  remainingToSpend: number;
  deficit: number;
  progressPercentage: number;
  collectionPercentage: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  audience: 'ALL' | 'OWNERS' | 'TENANTS';
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  attachmentUrl?: string | null;
  createdById?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisitGift {
  id: number;
  type: string;
  beneficiary: string;
  amount: string | number;
  date: string;
  description?: string | null;
  attachmentUrl?: string | null;
  createdById?: number | null;
  createdAt?: string;
}

export interface VoteOption {
  id: number;
  text: string;
}

export interface VoteResponse {
  id: number;
  voteId: number;
  apartmentId: number;
  optionId: number;
  createdAt?: string;
}

export interface Vote {
  id: number;
  question: string;
  options: VoteOption[] | any;
  startDate: string;
  endDate?: string | null;
  audience: 'ALL' | 'OWNERS' | 'TENANTS' | string;
  status: 'ACTIVE' | 'CLOSED';
  createdAt?: string;
  responses?: VoteResponse[];
  totalVotes?: number;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  location?: string | null;
  attendees?: string | null;
  agenda?: string | null;
  decisions?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
  createdById?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Apartment {
  id: number;
  unitNumber: string;
  floor?: number | null;
  buildingId?: number | null;
  residents?: any[];
}
