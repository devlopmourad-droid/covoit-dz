import { apiRequest, setTokens, clearTokens } from './client';
import { User } from '../types';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function register(input: {
  email: string; password: string; firstName: string; lastName: string; phone?: string; roles?: ('renter' | 'owner')[];
}): Promise<User> {
  const res = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input, auth: false });
  setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function logout() {
  clearTokens();
}

export async function fetchMe(): Promise<User> {
  return apiRequest<User>('/users/me');
}
