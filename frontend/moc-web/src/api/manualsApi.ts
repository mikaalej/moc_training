import axiosClient from './axiosClient';

/**
 * API functions for Manuals and Procedures endpoints.
 * Supports hierarchical document structure with procedures, work instructions, and forms.
 */

export enum ProcedureNodeType {
  Procedure = 1,
  WorkInstruction = 2,
  Form = 3,
  Attachment = 4,
}

export interface Manual {
  id: string;
  title: string;
  code?: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface ProcedureNode {
  id: string;
  manualId: string;
  parentNodeId?: string;
  nodeType: ProcedureNodeType;
  nodeTypeName: string;
  title: string;
  url?: string;
  isActive: boolean;
}

export interface ProcedureNodeTree extends ProcedureNode {
  children: ProcedureNodeTree[];
}

export interface ManualDetail extends Manual {
  nodes: ProcedureNodeTree[];
}

export interface CreateManualDto {
  title: string;
  code?: string;
}

export interface UpdateManualDto {
  title?: string;
  code?: string;
}

export interface CreateProcedureNodeDto {
  parentNodeId?: string;
  nodeType: ProcedureNodeType;
  title: string;
  url?: string;
}

export interface UpdateProcedureNodeDto {
  parentNodeId?: string;
  nodeType?: ProcedureNodeType;
  title?: string;
  url?: string;
}

// Manuals API - matches backend ManualsController
export const manualsApi = {
  // Manual CRUD
  getAll: (activeOnly?: boolean) =>
    axiosClient.get<Manual[]>('/manuals', { params: { activeOnly } }),

  getById: (id: string) =>
    axiosClient.get<ManualDetail>(`/manuals/${id}`),

  create: (data: CreateManualDto) =>
    axiosClient.post<Manual>('/manuals', data),

  update: (id: string, data: UpdateManualDto) =>
    axiosClient.put<Manual>(`/manuals/${id}`, data),

  deactivate: (id: string) =>
    axiosClient.delete(`/manuals/${id}`),

  // Procedure Nodes
  getNodes: (manualId: string) =>
    axiosClient.get<ProcedureNode[]>(`/manuals/${manualId}/nodes`),

  getNodeById: (id: string) =>
    axiosClient.get<ProcedureNode>(`/manuals/nodes/${id}`),

  createNode: (manualId: string, data: CreateProcedureNodeDto) =>
    axiosClient.post<ProcedureNode>(`/manuals/${manualId}/nodes`, data),

  updateNode: (id: string, data: UpdateProcedureNodeDto) =>
    axiosClient.put<ProcedureNode>(`/manuals/nodes/${id}`, data),

  deactivateNode: (id: string) =>
    axiosClient.delete(`/manuals/nodes/${id}`),
};
