import axiosClient from './axiosClient';

/**
 * API functions for List of Values (LOV) maintenance endpoints.
 * These support the admin screens for managing lookup tables.
 */

// Types for LOV entities
export interface Division {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  divisionId: string;
  divisionName?: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Section {
  id: string;
  departmentId: string;
  departmentName?: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  categoryName?: string;
  code: string;
  name: string;
  isActive: boolean;
}

// Division API
export const divisionApi = {
  getAll: () => axiosClient.get<Division[]>('/divisions'),
  getById: (id: string) => axiosClient.get<Division>(`/divisions/${id}`),
  create: (data: Omit<Division, 'id'>) => axiosClient.post<Division>('/divisions', data),
  update: (id: string, data: Partial<Division>) => axiosClient.put<Division>(`/divisions/${id}`, data),
  deactivate: (id: string) => axiosClient.delete(`/divisions/${id}`),
};

// Department API
export const departmentApi = {
  getAll: () => axiosClient.get<Department[]>('/departments'),
  getByDivision: (divisionId: string) => axiosClient.get<Department[]>(`/departments?divisionId=${divisionId}`),
  getById: (id: string) => axiosClient.get<Department>(`/departments/${id}`),
  create: (data: Omit<Department, 'id'>) => axiosClient.post<Department>('/departments', data),
  update: (id: string, data: Partial<Department>) => axiosClient.put<Department>(`/departments/${id}`, data),
  deactivate: (id: string) => axiosClient.delete(`/departments/${id}`),
};

// Section API
export const sectionApi = {
  getAll: () => axiosClient.get<Section[]>('/sections'),
  getByDepartment: (departmentId: string) => axiosClient.get<Section[]>(`/sections?departmentId=${departmentId}`),
  getById: (id: string) => axiosClient.get<Section>(`/sections/${id}`),
  create: (data: Omit<Section, 'id'>) => axiosClient.post<Section>('/sections', data),
  update: (id: string, data: Partial<Section>) => axiosClient.put<Section>(`/sections/${id}`, data),
  deactivate: (id: string) => axiosClient.delete(`/sections/${id}`),
};

// Unit API
export const unitApi = {
  getAll: () => axiosClient.get<Unit[]>('/units'),
  getById: (id: string) => axiosClient.get<Unit>(`/units/${id}`),
  create: (data: Omit<Unit, 'id'>) => axiosClient.post<Unit>('/units', data),
  update: (id: string, data: Partial<Unit>) => axiosClient.put<Unit>(`/units/${id}`, data),
  deactivate: (id: string) => axiosClient.delete(`/units/${id}`),
};

// Category API
export const categoryApi = {
  getAll: () => axiosClient.get<Category[]>('/categories'),
  getById: (id: string) => axiosClient.get<Category>(`/categories/${id}`),
  create: (data: Omit<Category, 'id'>) => axiosClient.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => axiosClient.put<Category>(`/categories/${id}`, data),
  deactivate: (id: string) => axiosClient.delete(`/categories/${id}`),
};

// Subcategory API
export const subcategoryApi = {
  getAll: () => axiosClient.get<Subcategory[]>('/subcategories'),
  getByCategory: (categoryId: string) => axiosClient.get<Subcategory[]>(`/subcategories?categoryId=${categoryId}`),
  getById: (id: string) => axiosClient.get<Subcategory>(`/subcategories/${id}`),
  create: (data: Omit<Subcategory, 'id'>) => axiosClient.post<Subcategory>('/subcategories', data),
  update: (id: string, data: Partial<Subcategory>) => axiosClient.put<Subcategory>(`/subcategories/${id}`, data),
  deactivate: (id: string) => axiosClient.delete(`/subcategories/${id}`),
};
