import axiosClient from './axiosClient';

/**
 * API functions for Dashboard KPIs and Reports endpoints.
 * Provides aggregated statistics and metrics for the MOC system.
 */

// Stage count for distribution
export interface StageCount {
  stage: string;
  count: number;
}

// Main dashboard KPIs interface
export interface DashboardKpis {
  totalMocs: number;
  closedMocs: number;
  activeMocs: number;
  draftMocs: number;
  submittedMocs: number;
  temporaryActive: number;
  permanentActive: number;
  overdueTemporary: number;
  inactiveOver60Days: number;
  greenRiskCount: number;
  yellowRiskCount: number;
  redRiskCount: number;
  standardEmocCount: number;
  bypassEmocCount: number;
  omocCount: number;
  dmocCount: number;
  averageDaysToClose: number;
  stageDistribution: StageCount[];
  pendingTasks: number;
  unreadNotifications: number;
}

// Division breakdown
export interface DivisionCount {
  divisionId: string;
  divisionName: string;
  totalCount: number;
  activeCount: number;
  closedCount: number;
}

// Category breakdown
export interface CategoryCount {
  categoryId: string;
  categoryName: string;
  totalCount: number;
  activeCount: number;
  closedCount: number;
}

// Risk level breakdown
export interface RiskLevelCount {
  riskLevel: string;
  totalCount: number;
  activeCount: number;
}

// Monthly trend data
export interface MonthlyTrend {
  year: number;
  month: number;
  monthName: string;
  createdCount: number;
  closedCount: number;
}

// Task type count
export interface TaskTypeCount {
  taskType: string;
  totalCount: number;
  openCount: number;
  completedCount: number;
}

// Task performance metrics
export interface TaskPerformance {
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionDays: number;
  tasksByType: TaskTypeCount[];
}

// Dashboard API - matches backend DashboardController
export const dashboardApi = {
  getKpis: (params?: {
    dateFrom?: string;
    dateTo?: string;
    divisionId?: string;
    departmentId?: string;
  }) => axiosClient.get<DashboardKpis>('/dashboard/kpis', { params }),

  getByDivision: () =>
    axiosClient.get<DivisionCount[]>('/dashboard/by-division'),

  getByCategory: () =>
    axiosClient.get<CategoryCount[]>('/dashboard/by-category'),

  getByRiskLevel: () =>
    axiosClient.get<RiskLevelCount[]>('/dashboard/by-risk-level'),

  getMonthlyTrend: (months?: number) =>
    axiosClient.get<MonthlyTrend[]>('/dashboard/monthly-trend', { params: { months } }),

  getTaskPerformance: () =>
    axiosClient.get<TaskPerformance>('/dashboard/task-performance'),
};
