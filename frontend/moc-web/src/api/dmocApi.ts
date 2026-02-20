import axiosClient from './axiosClient';

/**
 * API for DMOC (Departmental Management of Change).
 * All endpoints return 404 when EnableDmoc is false.
 * Base path: /dmoc (axiosClient baseURL already includes /api).
 */

export const DmocStatus = {
  Draft: 0,
  Submitted: 1,
  Approved: 2,
  Rejected: 3,
  Closed: 4,
} as const;
export type DmocStatus = (typeof DmocStatus)[keyof typeof DmocStatus];

export const DmocNatureOfChange = {
  Permanent: 0,
  Temporary: 1,
} as const;
export type DmocNatureOfChange = (typeof DmocNatureOfChange)[keyof typeof DmocNatureOfChange];

export interface DmocDto {
  id: string;
  dmocNumber: string | null;
  title: string;
  changeOriginatorUserId: string | null;
  changeOriginatorName: string;
  originatorPosition: string | null;
  areaOrDepartmentId: string | null;
  areaOrDepartmentName: string | null;
  natureOfChange: DmocNatureOfChange;
  targetImplementationDate: string | null;
  plannedEndDate: string | null;
  descriptionOfChange: string;
  reasonForChange: string;
  affectedEquipment: string | null;
  attachmentsOrReferenceLinks: string | null;
  additionalRemarks: string | null;
  status: DmocStatus;
  createdAtUtc: string;
  createdBy: string;
  modifiedAtUtc: string | null;
  modifiedBy: string | null;
}

export interface DmocFeaturesResponse {
  enableDmoc: boolean;
}

export interface CreateDmocDraftBody {
  title: string;
  changeOriginatorUserId?: string | null;
  changeOriginatorName: string;
  originatorPosition?: string | null;
  areaOrDepartmentId?: string | null;
  areaOrDepartmentName?: string | null;
  natureOfChange: DmocNatureOfChange;
  targetImplementationDate?: string | null;
  plannedEndDate?: string | null;
  descriptionOfChange: string;
  reasonForChange: string;
  affectedEquipment?: string | null;
  attachmentsOrReferenceLinks?: string | null;
  additionalRemarks?: string | null;
  createdBy: string;
}

export interface UpdateDmocDraftBody extends CreateDmocDraftBody {
  modifiedBy: string;
}

export interface PagedDmocResult {
  items: DmocDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ListDmocsParams {
  status?: DmocStatus;
  changeOriginatorUserId?: string;
  page?: number;
  pageSize?: number;
}

/** Extract backend validation message from axios error. */
export function getDmocErrorMessage(err: unknown): string {
  const ax = err as { response?: { data?: { message?: string } } };
  return ax?.response?.data?.message ?? 'Request failed.';
}

export const dmocApi = {
  getFeatures: () =>
    axiosClient.get<DmocFeaturesResponse>('/dmoc/features'),

  list: (params?: ListDmocsParams) =>
    axiosClient.get<PagedDmocResult>('/dmoc', { params }),

  getById: (id: string) =>
    axiosClient.get<DmocDto>(`/dmoc/${id}`),

  createDraft: (data: CreateDmocDraftBody) =>
    axiosClient.post<DmocDto>('/dmoc/drafts', data),

  updateDraft: (id: string, data: UpdateDmocDraftBody) =>
    axiosClient.put<DmocDto>(`/dmoc/${id}`, data),

  submit: (id: string) =>
    axiosClient.post<DmocDto>(`/dmoc/${id}/submit`),

  approve: (id: string, remarks?: string | null) =>
    axiosClient.post<DmocDto>(`/dmoc/${id}/approve`, { remarks }),

  reject: (id: string, remarks?: string | null) =>
    axiosClient.post<DmocDto>(`/dmoc/${id}/reject`, { remarks }),
};
