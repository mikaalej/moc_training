import axiosClient from './axiosClient';

/**
 * API for application roles (read-only).
 * Used in user management and approval level assignment (role per level).
 */

export interface Role {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
}

export const rolesApi = {
  /** Get all roles, optionally active only (default true). */
  getAll: (activeOnly = true) =>
    axiosClient.get<Role[]>('/roles', { params: { activeOnly } }),
};
