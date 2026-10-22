import { api } from "./authServices";

// All admin calls go through the same axios client as login,
// so they use VITE_API_BASE_URL and send the logged-in admin's token.

export class AdminApiError extends Error {
    public endpoint: string;
    public status?: number;

    constructor(endpoint: string, message: string, status?: number) {
        super(message);
        this.endpoint = endpoint;
        this.status = status;
        this.name = "AdminApiError";
    }
}

const toAdminError = (endpoint: string, error: any): AdminApiError => {
    if (error?.code === "ERR_NETWORK" || !error?.response) {
        return new AdminApiError(endpoint, "Cannot reach the API. Is it running on http://localhost:5080?");
    }
    const { status, data } = error.response;
    if (status === 403) return new AdminApiError(endpoint, "This account is not an Admin", status);
    const first = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : undefined;
    return new AdminApiError(endpoint, data?.message || first || data?.title || `Request failed (${status})`, status);
};

// endpoint is written without /api, e.g. "/admin/orders"
export const requestAdmin = async <T>(
    endpoint: string,
    options?: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown },
): Promise<T> => {
    try {
        const res = await api.request({ url: `/api${endpoint}`, method: options?.method ?? "GET", data: options?.body });
        return res as unknown as T;     // the axios interceptor already returns response.data
    } catch (error) {
        throw toAdminError(endpoint, error);
    }
};

export const adminGet = <T>(endpoint: string) => requestAdmin<T>(endpoint);
export const adminPost = <T>(endpoint: string, body?: unknown) => requestAdmin<T>(endpoint, { method: "POST", body });
export const adminPut = <T>(endpoint: string, body?: unknown) => requestAdmin<T>(endpoint, { method: "PUT", body });
export const adminDelete = <T = void>(endpoint: string) => requestAdmin<T>(endpoint, { method: "DELETE" });


export const adminError = (e: unknown, fallback = "Something went wrong") => e instanceof AdminApiError ? e.message : fallback;

// ---------- Types (match the API's JSON) ----------

export interface Msg { message: string }

export interface OrderItem { product: string; name: string; image: string; price: number; quantity: number; unit: string; lineTotal: number; packStatus: string }
export interface DeliveryPartner {
    _id: string; name: string; email: string; phone: string; avatar: string; vehicleType: string;
    vehicleNumber: string; isActive: boolean; activeOrders: number; createdAt: string;
}
export interface AdminOrder {
    _id: string; orderNumber: string; user: { _id: string; name: string; email: string; phone: string } | null;
    items: OrderItem[];
    shippingAddress: { label: string; fullName: string; phone: string; address: string; city: string; state: string; zip: string; instructions: string };
    paymentMethod: string; paymentMethodName: string; subtotal: number; deliveryFee: number; discount: number; tax: number; total: number;
    couponCode: string | null; deliverySlot: string; notes: string; status: string;
    statusHistory: { status: string; timestamp: string; note: string }[];
    deliveryPartner: DeliveryPartner | null; isPaid: boolean; paidAt: string | null; deliveredAt: string | null; createdAt: string;
}
export interface Payment {
    orderNumber: string; customerName: string; customerEmail: string; paymentMethod: string; paymentMethodName: string;
    amount: number; isPaid: boolean; paidAt: string | null; orderStatus: string; createdAt: string;
}
export interface Category { _id: string; slug: string; name: string; image: string; isActive: boolean; sortOrder: number; productCount: number }
export interface AdminProduct {
    _id: string; name: string; description: string; price: number; originalPrice: number; image: string; images: string[];
    category: string; categoryName: string; unit: string; stock: number; lowStockThreshold: number; isOrganic: boolean;
    isActive: boolean; rating: number; reviewCount: number; discount: number; highlights: string[]; storage: string;
    shelfLife: string; countryOfOrigin: string; dietaryTags: string[]; vendorId: string | null;
}
export interface SaveProduct {
    name: string; description: string; price: number; originalPrice: number; image: string; images: string[];
    category: string; unit: string; stock: number; lowStockThreshold: number; isOrganic: boolean; isActive: boolean;
    highlights: string[]; storage: string; shelfLife: string; countryOfOrigin: string; dietaryTags: string[]; vendorId: string | null;
}
export interface InventoryItem { _id: string; name: string; image: string; category: string; unit: string; stock: number; lowStockThreshold: number; stockStatus: string; isActive: boolean }
export interface Coupon {
    _id: string; code: string; description: string; discountPercent: number | null; discountFlat: number | null; maxDiscount: number | null;
    freeShipping: boolean; minOrderAmount: number; usageLimit: number | null; usedCount: number; expiresAt: string | null; isActive: boolean; createdAt: string;
}
export interface VendorApplication {
    _id: string; appId: string; storeName: string; ownerName: string; phone: string; email: string; category: string; city: string;
    address: string; hasPanVat: boolean; dailyCapacity: string; status: string; commissionRate: number; adminNote: string;
    userId: string | null; createdAt: string; reviewedAt: string | null;
}
export interface Customer {
    _id: string; name: string; email: string; phone: string; role: string; isActive: boolean;
    orderCount: number; totalSpent: number; lastOrderAt: string | null; createdAt: string;
}
export interface Review { _id: string; productId: string; productName: string; userId: string; userName: string; rating: number; comment: string; isVisible: boolean; createdAt: string }
export interface StoreSettings {
    storeName: string; supportEmail: string; supportPhone: string; deliveryFee: number; freeDeliveryThreshold: number;
    taxPercent: number; defaultCommissionPercent: number; lowStockThreshold: number;
}

// ---------- Endpoints ----------

const q = (params: Record<string, string | number | boolean | undefined | null>) => {
    const s = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all")
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
    return s ? `?${s}` : "";
};

export const adminApi = {
    // orders
    orders: (status?: string, search?: string) => adminGet<AdminOrder[]>(`/admin/orders${q({ status, search })}`),
    order: (no: string) => adminGet<AdminOrder>(`/admin/orders/${no}`),
    setOrderStatus: (no: string, status: string, note = "", otp?: string) => adminPut<AdminOrder>(`/admin/orders/${no}/status`, { status, note, otp: otp || null }),
    assignRider: (no: string, deliveryPartnerId: number) => adminPut<AdminOrder>(`/admin/orders/${no}/assign-delivery`, { deliveryPartnerId }),

    // payments
    payments: (paid?: boolean, method?: string) => adminGet<Payment[]>(`/admin/payments${q({ paid, method })}`),
    markPaid: (no: string) => adminPut<Msg>(`/admin/payments/${no}/mark-paid`),

    // delivery
    delivery: () => adminGet<{ partners: DeliveryPartner[]; activeOrders: AdminOrder[] }>("/admin/delivery"),
    createPartner: (body: unknown) => adminPost<DeliveryPartner>("/admin/delivery/partners", body),
    updatePartner: (id: string, body: unknown) => adminPut<DeliveryPartner>(`/admin/delivery/partners/${id}`, body),
    deletePartner: (id: string) => adminDelete<Msg>(`/admin/delivery/partners/${id}`),

    // catalog
    categories: () => adminGet<Category[]>("/admin/categories"),
    createCategory: (body: unknown) => adminPost<Category>("/admin/categories", body),
    updateCategory: (id: string, body: unknown) => adminPut<Category>(`/admin/categories/${id}`, body),
    deleteCategory: (id: string) => adminDelete<Msg>(`/admin/categories/${id}`),
    products: (search?: string, category?: string, status?: string) => adminGet<AdminProduct[]>(`/admin/products${q({ search, category, status })}`),
    createProduct: (body: SaveProduct) => adminPost<AdminProduct>("/admin/products", body),
    updateProduct: (id: string, body: SaveProduct) => adminPut<AdminProduct>(`/admin/products/${id}`, body),
    deleteProduct: (id: string) => adminDelete<Msg>(`/admin/products/${id}`),
    inventory: (filter?: string) => adminGet<InventoryItem[]>(`/admin/inventory${q({ filter })}`),
    updateStock: (id: string, stock: number, lowStockThreshold: number) => adminPut<InventoryItem>(`/admin/inventory/${id}`, { stock, lowStockThreshold }),

    // marketing
    coupons: () => adminGet<Coupon[]>("/admin/coupons"),
    createCoupon: (body: unknown) => adminPost<Coupon>("/admin/coupons", body),
    updateCoupon: (id: string, body: unknown) => adminPut<Coupon>(`/admin/coupons/${id}`, body),
    deleteCoupon: (id: string) => adminDelete<Msg>(`/admin/coupons/${id}`),
    reviews: (visible?: boolean, rating?: number) => adminGet<Review[]>(`/admin/reviews${q({ visible, rating })}`),
    setReviewVisible: (id: string, isActive: boolean) => adminPut<Review>(`/admin/reviews/${id}/visibility`, { isActive }),
    deleteReview: (id: string) => adminDelete<Msg>(`/admin/reviews/${id}`),

    // people
    vendors: (status?: string) => adminGet<VendorApplication[]>(`/admin/vendors${q({ status })}`),
    approveVendor: (id: string, note: string, commissionRate: number) => adminPut<VendorApplication>(`/admin/vendors/${id}/approve`, { note, commissionRate }),
    rejectVendor: (id: string, note: string) => adminPut<VendorApplication>(`/admin/vendors/${id}/reject`, { note }),
    // the API shows only Customers when role is empty, so "all" is sent on purpose
    customers: (role = "all", search?: string, active?: boolean) =>
        adminGet<Customer[]>(`/admin/customers?role=${encodeURIComponent(role)}${q({ search, active }).replace("?", "&")}`),
    setCustomerActive: (id: string, isActive: boolean) => adminPut<Msg>(`/admin/customers/${id}/status`, { isActive }),
    setCustomerRole: (id: string, role: string) => adminPut<Msg>(`/admin/customers/${id}/role`, { role }),

    // settings
    settings: () => adminGet<{ store: StoreSettings; admin: { name: string; email: string } }>("/admin/settings"),
    saveSettings: (body: StoreSettings) => adminPut<StoreSettings>("/admin/settings", body),
};