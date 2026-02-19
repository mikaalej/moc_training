import axiosClient from './axiosClient';

/**
 * API functions for Feedback and Lessons Learned endpoints.
 * Supports creating, listing, and viewing feedback entries.
 */

export interface FeedbackEntry {
  id: string;
  mocRequestId?: string;
  mocControlNumber?: string;
  title: string;
  message: string;
  isLessonLearned: boolean;
  createdAtUtc: string;
  createdBy: string;
}

export interface CreateFeedbackDto {
  mocRequestId?: string;
  title: string;
  message: string;
  isLessonLearned: boolean;
}

export interface UpdateFeedbackDto {
  title?: string;
  message?: string;
  isLessonLearned?: boolean;
}

// Feedback API - matches backend FeedbackController
export const feedbackApi = {
  // List endpoints
  getAll: (params?: { lessonsLearnedOnly?: boolean; mocRequestId?: string }) =>
    axiosClient.get<FeedbackEntry[]>('/feedback', { params }),

  getLessonsLearned: () =>
    axiosClient.get<FeedbackEntry[]>('/feedback/lessons-learned'),

  getByMocRequest: (mocRequestId: string) =>
    axiosClient.get<FeedbackEntry[]>(`/feedback/by-request/${mocRequestId}`),

  // Detail
  getById: (id: string) =>
    axiosClient.get<FeedbackEntry>(`/feedback/${id}`),

  // CRUD
  create: (data: CreateFeedbackDto) =>
    axiosClient.post<FeedbackEntry>('/feedback', data),

  update: (id: string, data: UpdateFeedbackDto) =>
    axiosClient.put<FeedbackEntry>(`/feedback/${id}`, data),

  delete: (id: string) =>
    axiosClient.delete(`/feedback/${id}`),
};
