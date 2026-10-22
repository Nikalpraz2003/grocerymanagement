import axios from 'axios';

// .env:  VITE_API_BASE_URL=http://localhost:5080   (no /api at the end)
// Empty = same origin, which works with the Vite proxy for /api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Uploaded photos are saved as "/api/files/...". When the API is on another address
// (VITE_API_BASE_URL set, e.g. after deploy), point those paths at the API server.
const fixFileUrls = (data: unknown): unknown => {
  if (!API_BASE_URL) return data;
  if (typeof data === 'string') return data.startsWith('/api/files/') ? API_BASE_URL + data : data;
  if (Array.isArray(data)) return data.map(fixFileUrls);
  if (data && typeof data === 'object') {
    for (const k of Object.keys(data)) (data as Record<string, unknown>)[k] = fixFileUrls((data as Record<string, unknown>)[k]);
  }
  return data;
};

// Return response.data directly; on 401 (expired token) log out
api.interceptors.response.use(
  (response) => (response.config.responseType === 'blob' ? response.data : fixFileUrls(response.data)),
  (error) => {
    const url: string = error.config?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    // Don't redirect when the login itself fails (wrong password) - just show the error
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---------- What the Pasalmandu API really returns ----------
interface ApiUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;          // "Admin" | "Vendor" | "Customer"
  isAdmin: boolean;
  isVendor: boolean;
}

interface ApiAuthResponse {
  token: string;
  expiresAt: string;
  user: ApiUser;
}

// ---------- Shape the rest of the app uses ----------
export interface AppUser {
  id: string;
  _id: string;
  email: string;
  fullName: string;
  name: string;
  phone: string;
  avatar: string;
  roles: string[];
  role: string;
  isAdmin: boolean;
  isVendor: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: AppUser;
}

export type RegisterResponse = LoginResponse;

const toAppUser = (u: ApiUser): AppUser => ({
  id: u._id,
  _id: u._id,
  email: u.email,
  fullName: u.name,
  name: u.name,
  phone: u.phone ?? '',
  avatar: u.avatar ?? '',
  roles: [u.role],
  role: u.role,
  isAdmin: u.isAdmin,
  isVendor: u.isVendor,
});

const saveSession = (res: ApiAuthResponse): LoginResponse => {
  const result: LoginResponse = {
    accessToken: res.token,
    expiresAt: res.expiresAt,
    user: toAppUser(res.user),
  };
  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('user', JSON.stringify(result.user));
  return result;
};

// Turns any API error into { message: "..." } so Login.tsx can show it
const toError = (error: any) => {
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return { message: 'Cannot reach the server. Is the API running on http://localhost:5080?' };
  }
  const data = error.response.data;
  if (data?.message) return { message: data.message };
  if (data?.errors) {
    const first = Object.values(data.errors as Record<string, string[]>).flat()[0];
    if (first) return { message: first };
  }
  return { message: data?.title || `Request failed (${error.response.status})` };
};

const authService = {
  // Register new user (the API logs them in immediately)
  register: async (email: string, password: string, fullName: string): Promise<RegisterResponse> => {
    try {
      const res = (await api.post('/api/auth/register', {
        name: fullName,
        email,
        password,
        confirmPassword: password,
      })) as unknown as ApiAuthResponse;
      return saveSession(res);
    } catch (error: any) {
      throw toError(error);
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const res = (await api.post('/api/auth/login', { email, password })) as unknown as ApiAuthResponse;
      return saveSession(res);
    } catch (error: any) {
      throw toError(error);
    }
  },

  // Refresh the saved user from the API (call on app start if logged in)
  me: async (): Promise<AppUser> => {
    const u = (await api.get('/api/auth/me')) as unknown as ApiUser;
    const user = toAppUser(u);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): AppUser | null => {
    try {
      const user = localStorage.getItem('user');
      return user ? (JSON.parse(user) as AppUser) : null;
    } catch {
      return null;
    }
  },

  getToken: () => localStorage.getItem('accessToken'),

  isAuthenticated: () => !!localStorage.getItem('accessToken'),

  isAdmin: () => !!authService.getCurrentUser()?.isAdmin,
};

export default authService;