import { api } from "./authServices";

// All vendor calls use the same axios client as login (sends the vendor's token).
// The API only returns the logged-in vendor's own products and orders.

export class VendorApiError extends Error {
    public status?: number;
    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
        this.name = "VendorApiError";
    }
}

const toVendorError = (error: any): VendorApiError => {
    if (error?.code === "ERR_NETWORK" || !error?.response) {
        return new VendorApiError("Cannot reach the API. Is it running on http://localhost:5080?");
    }
    const { status, data } = error.response;
    if (status === 403) return new VendorApiError("This account is not a Vendor. If admin just approved you, log out and log in again.", status);
    const first = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : undefined;
    return new VendorApiError(data?.message || first || data?.title || `Request failed (${status})`, status);
};

// endpoint is written without /api, e.g. "/vendor/orders"
const request = async <T>(endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: unknown): Promise<T> => {
    try {
        const res = await api.request({ url: `/api${endpoint}`, method, data: body });
        return res as unknown as T;     // the axios interceptor already returns response.data
    } catch (error) {
        throw toVendorError(error);
    }
};

export const errorMessage = (e: unknown, fallback = "Something went wrong") =>
    e instanceof VendorApiError ? e.message : fallback;

// ---------- Types (match the API's JSON) ----------

export interface VendorStore { storeName: string; ownerName: string; email: string; phone: string; city: string; appId: string; commissionRate: number }
export interface SalesPoint { date: string; orders: number; revenue: number }
export interface NameValue { name: string; value: number; count: number }

export interface VendorOrderItem {
    _id: string; product: string; name: string; image: string; unit: string;
    price: number; quantity: number; lineTotal: number; packStatus: string; packedAt: string | null;
}
export interface VendorOrder {
    _id: string; orderNumber: string; customerName: string; city: string; orderStatus: string;
    paymentMethodName: string; isPaid: boolean; packStatus: string; itemCount: number; itemsTotal: number;
    items: VendorOrderItem[]; createdAt: string; deliveredAt: string | null;
}
export interface VendorDashboard {
    store: VendorStore; products: number; activeProducts: number; lowStock: number; outOfStock: number;
    ordersToPack: number; todayOrders: number; totalOrders: number; grossSales: number; commission: number;
    earnings: number; pendingSales: number; salesLast7Days: SalesPoint[]; recentOrders: VendorOrder[];
}
export interface VendorEarnings {
    days: number; commissionRate: number; ordersCount: number; itemsSold: number; grossSales: number;
    commission: number; earnings: number; pendingSales: number; salesByDay: SalesPoint[];
    topProducts: NameValue[];
    orders: { orderNumber: string; date: string; items: number; gross: number; commission: number; earnings: number }[];
}
export interface VendorProduct {
    _id: string; name: string; description: string; price: number; originalPrice: number; image: string;
    images: string[]; category: string; categoryName: string; unit: string; stock: number; lowStockThreshold: number;
    isOrganic: boolean; isActive: boolean; rating: number; reviewCount: number; discount: number;
    highlights: string[]; storage: string; shelfLife: string; countryOfOrigin: string; dietaryTags: string[];
}
export interface InventoryItem {
    _id: string; name: string; image: string; category: string; unit: string;
    stock: number; lowStockThreshold: number; stockStatus: string; isActive: boolean;
}
export interface Category { _id: string; slug: string; name: string; isActive: boolean }

// Body for creating / editing a product
export interface SaveProduct {
    name: string; description: string; price: number; originalPrice: number; image: string; images: string[];
    category: string; unit: string; stock: number; lowStockThreshold: number; isOrganic: boolean; isActive: boolean;
    highlights: string[]; storage: string; shelfLife: string; countryOfOrigin: string; dietaryTags: string[];
}

// ---------- Endpoints ----------

export const vendorApi = {
    store: () => request<VendorStore>("/vendor/store"),
    dashboard: () => request<VendorDashboard>("/vendor/dashboard"),

    products: (search = "", status = "all") =>
        request<VendorProduct[]>(`/vendor/products?search=${encodeURIComponent(search)}&status=${status}`),
    createProduct: (body: SaveProduct) => request<VendorProduct>("/vendor/products", "POST", body),
    updateProduct: (id: string, body: SaveProduct) => request<VendorProduct>(`/vendor/products/${id}`, "PUT", body),
    deleteProduct: (id: string) => request<{ message: string }>(`/vendor/products/${id}`, "DELETE"),

    inventory: (filter = "all") => request<InventoryItem[]>(`/vendor/inventory?filter=${filter}`),
    updateStock: (id: string, stock: number, lowStockThreshold?: number) =>
        request<InventoryItem>(`/vendor/inventory/${id}`, "PUT", { stock, lowStockThreshold }),

    orders: (status = "all", search = "") =>
        request<VendorOrder[]>(`/vendor/orders?status=${status}&search=${encodeURIComponent(search)}`),
    markReady: (orderNumber: string) => request<VendorOrder>(`/vendor/orders/${orderNumber}/ready`, "PUT"),

    earnings: (days = 30) => request<VendorEarnings>(`/vendor/earnings?days=${days}`),

    // public endpoint, used for the category dropdown
    categories: () => request<Category[]>("/categories"),
};