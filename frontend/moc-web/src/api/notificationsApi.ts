import axiosClient from './axiosClient';

/**
 * API functions for Notification management endpoints.
 * Supports listing, marking as read, and dismissing notifications.
 */

export const NotificationStatus = {
  Unread: 1,
  Read: 2,
  Dismissed: 3,
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export interface Notification {
  id: string;
  type: string;
  message: string;
  mocRequestId?: string;
  mocControlNumber?: string;
  recipientRoleKey: string;
  recipientUserId?: string;
  status: NotificationStatus;
  statusName: string;
  readAtUtc?: string;
  createdAtUtc: string;
}

export interface CreateNotificationDto {
  type: string;
  message: string;
  mocRequestId?: string;
  recipientRoleKey: string;
  recipientUserId?: string;
}

// Notifications API - matches backend NotificationsController
export const notificationsApi = {
  // List endpoints
  getAll: (params?: {
    status?: NotificationStatus;
    recipientRoleKey?: string;
    recipientUserId?: string;
    mocRequestId?: string;
  }) => axiosClient.get<Notification[]>('/notifications', { params }),

  getUnread: (params?: { recipientRoleKey?: string; recipientUserId?: string }) =>
    axiosClient.get<Notification[]>('/notifications/unread', { params }),

  getUnreadCount: (params?: { recipientRoleKey?: string; recipientUserId?: string }) =>
    axiosClient.get<number>('/notifications/unread/count', { params }),

  // Detail
  getById: (id: string) =>
    axiosClient.get<Notification>(`/notifications/${id}`),

  // Create
  create: (data: CreateNotificationDto) =>
    axiosClient.post<Notification>('/notifications', data),

  // Actions
  markAsRead: (id: string) =>
    axiosClient.post<Notification>(`/notifications/${id}/read`),

  markAllAsRead: (params?: { recipientRoleKey?: string; recipientUserId?: string }) =>
    axiosClient.post<{ count: number }>('/notifications/read-all', null, { params }),

  dismiss: (id: string) =>
    axiosClient.post<Notification>(`/notifications/${id}/dismiss`),
};
