import axiosClient from './axiosClient';

/**
 * API for maintaining approval levels.
 * Admin can add/remove/reorder levels and assign a role per level.
 * When a MOC is submitted, MocApprover rows are created from these levels in order.
 */

export interface ApprovalLevel {
  id: string;
  order: number;
  roleKey: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface CreateApprovalLevelDto {
  order?: number;
  roleKey: string;
  isActive?: boolean;
}

export interface UpdateApprovalLevelDto {
  order?: number;
  roleKey?: string;
  isActive?: boolean;
}

export const approvalLevelsApi = {
  /** Get all approval levels ordered by order. activeOnly=false returns all for admin. */
  getAll: (activeOnly = false) =>
    axiosClient.get<ApprovalLevel[]>('/approvallevels', { params: { activeOnly } }),

  getById: (id: string) =>
    axiosClient.get<ApprovalLevel>(`/approvallevels/${id}`),

  create: (data: CreateApprovalLevelDto) =>
    axiosClient.post<ApprovalLevel>('/approvallevels', data),

  update: (id: string, data: UpdateApprovalLevelDto) =>
    axiosClient.put<ApprovalLevel>(`/approvallevels/${id}`, data),

  delete: (id: string) =>
    axiosClient.delete(`/approvallevels/${id}`),
};
