import axiosClient from './axiosClient';

/**
 * API for user management (AppUser).
 * Used by Admin Users tab for list, add, edit, and deactivate.
 */

export interface User {
  id: string;
  userName: string;
  displayName: string;
  roleKey: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface CreateUserDto {
  userName: string;
  displayName?: string;
  roleKey: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  userName?: string;
  displayName?: string;
  roleKey?: string;
  isActive?: boolean;
}

export const usersApi = {
  getAll: (activeOnly = false) =>
    axiosClient.get<User[]>('/users', { params: { activeOnly } }),

  getById: (id: string) =>
    axiosClient.get<User>(`/users/${id}`),

  create: (data: CreateUserDto) =>
    axiosClient.post<User>('/users', data),

  update: (id: string, data: UpdateUserDto) =>
    axiosClient.put<User>(`/users/${id}`, data),

  deactivate: (id: string) =>
    axiosClient.delete(`/users/${id}`),
};
