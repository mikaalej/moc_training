import axiosClient from './axiosClient';

export enum TaskType {
  Evaluation = 1,
  Documentation = 2,
  Approval = 3,
  Implementation = 4,
  Restoration = 5,
  Review = 6,
}

export enum MocTaskStatus {
  Open = 1,
  Completed = 2,
  Cancelled = 3,
}

export interface TaskItem {
  id: string;
  mocRequestId: string;
  mocControlNumber: string;
  mocTitle: string;
  mocRiskLevel?: number;
  assignedRoleKey: string;
  assignedUserId?: string;
  taskType: TaskType;
  taskTypeName: string;
  title: string;
  description?: string;
  dueDateUtc?: string;
  status: MocTaskStatus;
  statusName: string;
  completionRemarks?: string;
  completedAtUtc?: string;
  completedBy?: string;
  createdAtUtc: string;
  isOverdue: boolean;
}

export interface CreateTaskDto {
  mocRequestId: string;
  assignedRoleKey: string;
  assignedUserId?: string;
  taskType: TaskType;
  title: string;
  description?: string;
  dueDateUtc?: string;
}

export interface CompleteTaskDto {
  remarks?: string;
}

export interface ReassignTaskDto {
  assignedRoleKey?: string;
  assignedUserId?: string;
}

export const tasksApi = {
  getAll: (params?: {
    status?: MocTaskStatus;
    taskType?: TaskType;
    assignedRoleKey?: string;
    assignedUserId?: string;
    mocRequestId?: string;
  }) => axiosClient.get<TaskItem[]>('/tasks', { params }),

  getOpen: (params?: { assignedRoleKey?: string; assignedUserId?: string }) =>
    axiosClient.get<TaskItem[]>('/tasks/open', { params }),

  getCompleted: (params?: { assignedRoleKey?: string; assignedUserId?: string }) =>
    axiosClient.get<TaskItem[]>('/tasks/completed', { params }),

  getByType: (taskType: TaskType) =>
    axiosClient.get<TaskItem[]>(`/tasks/by-type/${taskType}`),

  getById: (id: string) =>
    axiosClient.get<TaskItem>(`/tasks/${id}`),

  create: (data: CreateTaskDto) =>
    axiosClient.post<TaskItem>('/tasks', data),

  complete: (id: string, data?: CompleteTaskDto) =>
    axiosClient.post<TaskItem>(`/tasks/${id}/complete`, data || {}),

  cancel: (id: string) =>
    axiosClient.post<TaskItem>(`/tasks/${id}/cancel`),

  reassign: (id: string, data: ReassignTaskDto) =>
    axiosClient.post<TaskItem>(`/tasks/${id}/reassign`, data),
};
