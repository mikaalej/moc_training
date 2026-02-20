import axiosClient from './axiosClient';

/**
 * API functions for MOC Request endpoints.
 * Supports Standard EMOC, Bypass EMOC, OMOC, and DMOC request types.
 */

// Const objects matching backend (erasable; no enum)
export const MocRequestType = {
  StandardEmoc: 1,
  BypassEmoc: 2,
  Omoc: 3,
  Dmoc: 4,
} as const;
export type MocRequestType = (typeof MocRequestType)[keyof typeof MocRequestType];

export const RiskLevel = {
  Green: 1,
  Yellow: 2,
  Red: 3,
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const MocStage = {
  Initiation: 1,
  Validation: 2,
  Evaluation: 3,
  FinalApproval: 4,
  PreImplementation: 5,
  Implementation: 6,
  RestorationOrCloseout: 7,
} as const;
export type MocStage = (typeof MocStage)[keyof typeof MocStage];

export const MocStatus = {
  Draft: 1,
  Submitted: 2,
  Active: 3,
  Inactive: 4,
  Approved: 5,
  Closed: 6,
  Cancelled: 7,
} as const;
export type MocStatus = (typeof MocStatus)[keyof typeof MocStatus];

// Request DTOs matching backend
export interface MocRequestListItem {
  id: string;
  controlNumber: string;
  requestType: MocRequestType;
  requestTypeName: string;
  title: string;
  status: MocStatus;
  statusName: string;
  currentStage: MocStage;
  currentStageName: string;
  riskLevel?: RiskLevel;
  riskLevelName?: string;
  isTemporary: boolean;
  targetImplementationDate: string;
  plannedRestorationDate?: string;
  createdAtUtc: string;
  markedInactiveAtUtc?: string;
  isOverdue: boolean;
  daysInactive?: number;
}

export interface MocActionItem {
  id: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  completedAtUtc?: string;
}

export interface MocDocument {
  id: string;
  documentGroup: string;
  documentType: string;
  name: string;
  isLink: boolean;
  url?: string;
}

export interface MocApprover {
  id: string;
  roleKey: string;
  /** 1-based order from approval levels; approvers must complete in this order. */
  levelOrder: number;
  isCompleted: boolean;
  isApproved?: boolean;
  remarks?: string;
  completedAtUtc?: string;
  completedBy?: string;
}

export interface MocRequestDetail {
  id: string;
  controlNumber: string;
  requestType: MocRequestType;
  requestTypeName: string;
  title: string;
  originator: string;
  divisionId: string;
  divisionName: string;
  departmentId: string;
  departmentName: string;
  sectionId: string;
  sectionName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  unitsAffected: string;
  equipmentTag: string;
  isTemporary: boolean;
  targetImplementationDate: string;
  plannedRestorationDate?: string;
  scopeDescription: string;
  riskToolUsed?: string;
  riskLevel?: RiskLevel;
  riskLevelName?: string;
  currentStage: MocStage;
  currentStageName: string;
  status: MocStatus;
  statusName: string;
  bypassDurationDays?: number;
  isBypassEmergency?: boolean;
  bypassType?: string;
  markedInactiveAtUtc?: string;
  createdAtUtc: string;
  createdBy: string;
  modifiedAtUtc?: string;
  modifiedBy?: string;
  actionItems: MocActionItem[];
  documents: MocDocument[];
  approvers: MocApprover[];
}

export interface CreateMocRequestDto {
  requestType: MocRequestType;
  title: string;
  originator?: string;
  divisionId: string;
  departmentId: string;
  sectionId: string;
  categoryId: string;
  subcategoryId: string;
  unitsAffected?: string;
  equipmentTag?: string;
  isTemporary: boolean;
  targetImplementationDate: string;
  plannedRestorationDate?: string;
  scopeDescription?: string;
  riskToolUsed?: string;
  riskLevel?: RiskLevel;
  bypassDurationDays?: number;
  isBypassEmergency?: boolean;
  bypassType?: string;
  saveAsDraft: boolean;
}

export interface UpdateMocRequestDto {
  title?: string;
  divisionId?: string;
  departmentId?: string;
  sectionId?: string;
  categoryId?: string;
  subcategoryId?: string;
  unitsAffected?: string;
  equipmentTag?: string;
  isTemporary?: boolean;
  targetImplementationDate?: string;
  plannedRestorationDate?: string;
  scopeDescription?: string;
  riskToolUsed?: string;
  riskLevel?: RiskLevel;
  bypassDurationDays?: number;
  isBypassEmergency?: boolean;
  bypassType?: string;
}

/** Single activity (audit) log entry from GET /mocrequests/{id}/activity. */
export interface ActivityLogEntry {
  id: string;
  action: string;
  actorDisplay: string;
  timestampUtc: string;
  detailsJson?: string;
}

export interface MocListFilters {
  requestType?: MocRequestType;
  status?: MocStatus;
  stage?: MocStage;
  riskLevel?: RiskLevel;
  divisionId?: string;
  departmentId?: string;
  sectionId?: string;
  categoryId?: string;
  subcategoryId?: string;
  isTemporary?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  forRestoration?: boolean;
  inactiveOver60Days?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// MOC Request API - matches backend MocRequestsController
export const mocApi = {
  // List endpoints
  getAll: (filters?: MocListFilters) => 
    axiosClient.get<PagedResult<MocRequestListItem>>('/mocrequests', { params: filters }),
  
  getActive: (filters?: MocListFilters) => 
    axiosClient.get<PagedResult<MocRequestListItem>>('/mocrequests/active', { params: filters }),
  
  getInactive: (filters?: MocListFilters) => 
    axiosClient.get<PagedResult<MocRequestListItem>>('/mocrequests/inactive', { params: filters }),
  
  getApproved: (filters?: MocListFilters) => 
    axiosClient.get<PagedResult<MocRequestListItem>>('/mocrequests/approved', { params: filters }),
  
  getForRestoration: (filters?: MocListFilters) => 
    axiosClient.get<PagedResult<MocRequestListItem>>('/mocrequests/for-restoration', { params: filters }),
  
  getClosed: (filters?: MocListFilters) => 
    axiosClient.get<PagedResult<MocRequestListItem>>('/mocrequests/closed', { params: filters }),

  getBypass: (filters?: MocListFilters) => 
    axiosClient.get<PagedResult<MocRequestListItem>>('/mocrequests/bypass', { params: filters }),

  getDrafts: (filters?: MocListFilters) => 
    axiosClient.get<PagedResult<MocRequestListItem>>('/mocrequests/drafts', { params: filters }),

  // Detail and CRUD
  getById: (id: string) => 
    axiosClient.get<MocRequestDetail>(`/mocrequests/${id}`),
  
  create: (data: CreateMocRequestDto) => 
    axiosClient.post<MocRequestDetail>('/mocrequests', data),
  
  update: (id: string, data: UpdateMocRequestDto) => 
    axiosClient.put<MocRequestDetail>(`/mocrequests/${id}`, data),
  
  delete: (id: string) => 
    axiosClient.delete(`/mocrequests/${id}`),

  // Workflow actions
  submit: (id: string) => 
    axiosClient.post<MocRequestDetail>(`/mocrequests/${id}/submit`),
  
  advanceStage: (id: string, remarks?: string) => 
    axiosClient.post<MocRequestDetail>(`/mocrequests/${id}/advance-stage`, { remarks }),

  /** Records an approver's decision (approve or reject) for their slot. Required before advancing from Validation or FinalApproval. */
  completeApprover: (mocId: string, approverId: string, body: { approved: boolean; remarks?: string; completedBy?: string }) =>
    axiosClient.post<MocRequestDetail>(`/mocrequests/${mocId}/approvers/${approverId}/complete`, body),

  /** Fetches the activity (audit) log for a MOC: who did what and when. */
  getActivity: (id: string) =>
    axiosClient.get<ActivityLogEntry[]>(`/mocrequests/${id}/activity`),

  /** Resets all approvers for this MOC to pending (clears completion and decision). */
  resetApprovers: (id: string) =>
    axiosClient.post<MocRequestDetail>(`/mocrequests/${id}/approvers/reset`),

  markInactive: (id: string) => 
    axiosClient.post<MocRequestDetail>(`/mocrequests/${id}/mark-inactive`),
  
  reactivate: (id: string) => 
    axiosClient.post<MocRequestDetail>(`/mocrequests/${id}/reactivate`),

  // Export
  exportCsv: (filters?: MocListFilters) => 
    axiosClient.get('/mocrequests/export/csv', { params: filters, responseType: 'blob' }),
};
