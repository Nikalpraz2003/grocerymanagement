
import axios from "axios";

// .env: VITE_API_BASE_URL=http://localhost:5080
// Do not add /api at the end.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Fix relative image URLs returned by the API
const fixFileUrls = (data: unknown): unknown => {
    if (!API_BASE_URL) return data;

    if (typeof data === "string") {
        if (
            data.startsWith("/api/files/") ||
            data.startsWith("/api/profile/avatar/")
        ) {
            return API_BASE_URL + data;
        }

        return data;
    }

    if (Array.isArray(data)) {
        return data.map(fixFileUrls);
    }

    if (data && typeof data === "object") {
        const result = { ...data } as Record<string, unknown>;

        for (const key of Object.keys(result)) {
            result[key] = fixFileUrls(result[key]);
        }

        return result;
    }

    return data;
};

// Handle API responses and expired tokens
api.interceptors.response.use(
    (response) => {
        if (response.config.responseType === "blob") {
            return response.data;
        }

        return fixFileUrls(response.data);
    },
    (error) => {
        const url: string = error.config?.url ?? "";

        const isAuthCall =
            url.includes("/auth/login") ||
            url.includes("/auth/register") ||
            url.includes("/auth/forgot-password") ||
            url.includes("/auth/reset-password");

        if (error.response?.status === 401 && !isAuthCall) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");

            notifyUserUpdated(null);

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

// ---------- API user response ----------

interface ApiUser {
    _id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    role: string;
    isAdmin: boolean;
    isVendor: boolean;
}

interface ApiAuthResponse {
    token: string;
    expiresAt: string;
    user: ApiUser;
}

// ---------- Application user ----------

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

// Convert backend user into frontend user
const toAppUser = (u: ApiUser): AppUser => ({
    id: u._id,
    _id: u._id,
    email: u.email,
    fullName: u.name,
    name: u.name,
    phone: u.phone ?? "",
    avatar: u.avatar ?? "",
    roles: [u.role],
    role: u.role,
    isAdmin: u.isAdmin,
    isVendor: u.isVendor,
});

// ---------- User synchronization ----------

// Notify Navbar and other components when user information changes.
export const notifyUserUpdated = (user: AppUser | null): void => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent<AppUser | null>("pasalmandu:user-updated", {
            detail: user,
        })
    );
};

// Save login session
const saveSession = (res: ApiAuthResponse): LoginResponse => {
    const result: LoginResponse = {
        accessToken: res.token,
        expiresAt: res.expiresAt,
        user: toAppUser(res.user),
    };

    localStorage.setItem("accessToken", result.accessToken);
    localStorage.setItem("user", JSON.stringify(result.user));

    notifyUserUpdated(result.user);

    return result;
};

// Convert API errors into readable messages
const toError = (error: any) => {
    if (error.code === "ERR_NETWORK" || !error.response) {
        return {
            message:
                "Cannot reach the server. Is the API running on http://localhost:5080?",
        };
    }

    const data = error.response.data;

    if (data?.message) {
        return { message: data.message };
    }

    if (data?.errors) {
        const first = Object.values(
            data.errors as Record<string, string[]>
        ).flat()[0];

        if (first) {
            return { message: first };
        }
    }

    return {
        message:
            data?.title ||
            `Request failed (${error.response.status})`,
    };
};

// ---------- Authentication service ----------

const authService = {
    // Register user
    register: async (
        email: string,
        password: string,
        fullName: string
    ): Promise<void> => {
        try {
            await api.post("/api/auth/register", {
                name: fullName,
                email,
                password,
                confirmPassword: password,
            });
        } catch (error: any) {
            throw toError(error);
        }
    },

    // Login user
    login: async (
        email: string,
        password: string
    ): Promise<LoginResponse> => {
        try {
            const res = (await api.post(
                "/api/auth/login",
                { email, password }
            )) as unknown as ApiAuthResponse;

            return saveSession(res);
        } catch (error: any) {
            throw toError(error);
        }
    },

    // Refresh logged-in user from backend
    me: async (): Promise<AppUser> => {
        const u = (await api.get(
            "/api/auth/me"
        )) as unknown as ApiUser;

        const user = toAppUser(u);

        localStorage.setItem("user", JSON.stringify(user));

        // Immediately update Navbar
        notifyUserUpdated(user);

        return user;
    },

    // Forgot password
    forgotPassword: async (
        email: string
    ): Promise<{ message: string }> => {
        try {
            const res = (await api.post(
                "/api/auth/forgot-password",
                { email }
            )) as unknown as { message?: string };

            return {
                message:
                    res?.message ??
                    "If this email is registered, a reset link has been sent.",
            };
        } catch (error: any) {
            throw toError(error);
        }
    },

    // Reset password
    resetPassword: async (
        email: string,
        code: string,
        newPassword: string
    ): Promise<{ message: string }> => {
        try {
            const res = (await api.post(
                "/api/auth/reset-password",
                {
                    email,
                    code,
                    newPassword,
                    confirmPassword: newPassword,
                }
            )) as unknown as { message?: string };

            return {
                message: res?.message ?? "Your password has been reset.",
            };
        } catch (error: any) {
            throw toError(error);
        }
    },

    // Logout
    logout: (): void => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        notifyUserUpdated(null);
    },

    // Get currently logged-in user
    getCurrentUser: (): AppUser | null => {
        try {
            const user = localStorage.getItem("user");

            return user ? (JSON.parse(user) as AppUser) : null;
        } catch {
            return null;
        }
    },

    getToken: () => localStorage.getItem("accessToken"),

    isAuthenticated: () => !!localStorage.getItem("accessToken"),

    isAdmin: () => !!authService.getCurrentUser()?.isAdmin,
};

export default authService;
