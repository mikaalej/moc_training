import axiosClient from './axiosClient';

/**
 * API functions for MOC Request endpoints.
 * Supports Standard EMOC, Bypass EMOC, OMOC, and DMOC request types.
 */

// Enums matching backend
export enum MocRequestType {
  StandardEmoc = 1,
  BypassEmoc = 2,
  Omoc = 3,
  Dmoc = 4,
}

export enum RiskLevel {
  Green = 1,
  Yellow = 2,
  Red = 3,
}

export enum MocStage {
  Initiation = 1,
  Validation = 2,
  Evaluation = 3,
  FinalApproval = 4,
  PreImplementation = 5,
  Implementation = 6,
  RestorationOrCloseout = 7,
}

export enum MocStatus {
  Draft = 1,
  Submitted = 2,
  Active = 3,
  Inactive = 4,
  Approved = 5,
  Closed = 6,
  Cancelled = 7,
}

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

  markInactive: (id: string) => 
    axiosClient.post<MocRequestDetail>(`/mocrequests/${id}/mark-inactive`),
  
  reactivate: (id: string) => 
    axiosClient.post<MocRequestDetail>(`/mocrequests/${id}/reactivate`),

  // Export
  exportCsv: (filters?: MocListFilters) => 
    axiosClient.get('/mocrequests/export/csv', { params: filters, responseType: 'blob' }),
};
