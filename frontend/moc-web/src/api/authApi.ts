import axiosClient from './axiosClient';
import type { User } from './usersApi';

/**
 * Auth API for login (stub auth). Signup uses usersApi.create with password.
 */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

export const authApi = {
  login: (data: LoginRequest) =>
    axiosClient.post<LoginResponse>('/auth/login', data),
};
