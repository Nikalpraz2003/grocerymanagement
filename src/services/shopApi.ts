import { useEffect, useState } from "react";
import authService, { api } from "./authServices";
import type { Product } from "../types";
import { categoriesData } from "../assets/assets";

// Everything the customer shop needs from the .NET API.
// Calls go through the same axios client as login (sends the token when logged in).

export const shopError = (e: any, fallback = "Something went wrong"): string => {
    if (e?.code === "ECONNABORTED") return "The server took too long to answer. Please try again.";
    if (e?.code === "ERR_NETWORK" || (e && !e.response && e.code)) return "Cannot reach the server. Please try again.";

    if (e?.code === "ERR_NETWORK" || (e && !e.response && e.code)) return "Cannot reach the server. Please try again.";
    const data = e?.response?.data;
    const first = data?.errors ? (Object.values(data.errors as Record<string, string[]>).flat()[0] as string) : undefined;
    return data?.message || first || fallback;
};

const get = async <T>(url: string) => (await api.get(url)) as unknown as T;
const post = async <T>(url: string, body?: unknown) => (await api.post(url, body)) as unknown as T;
const put = async <T>(url: string, body?: unknown) => (await api.put(url, body)) as unknown as T;
const del = async <T>(url: string) => (await api.delete(url)) as unknown as T;

// ---------- Types (match the API's JSON) ----------

export interface ShopCategory { _id: string; slug: string; name: string; image: string; isActive: boolean; productCount: number }
export interface StoreSettings { storeName: string; supportEmail: string; supportPhone: string; deliveryFee: number; freeDeliveryThreshold: number; taxPercent: number }
export interface ShopReview { _id: string; productId: string; userId: string; userName: string; rating: number; comment: string; createdAt: string }
export interface CouponResult { code: string; description: string; discountAmount: number; freeShipping: boolean }
export interface SavedAddress {
    _id: string; label: string; fullName: string; phone: string; address: string; city: string; state: string;
    zip: string; instructions: string; isDefault: boolean; lat: number; lng: number;
}
export type SaveAddress = Omit<SavedAddress, "_id">;
export interface ShopOrder {
    _id: string; orderNumber: string;
    items: { product: string; name: string; image: string; price: number; quantity: number; unit: string; lineTotal: number }[];
    shippingAddress: { label: string; fullName: string; phone: string; address: string; city: string; state: string; zip: string; instructions: string };
    paymentMethod: string; paymentMethodName: string; subtotal: number; deliveryFee: number; discount: number; tax: number; total: number;
    couponCode: string | null; deliverySlot: string; notes: string; status: string;
    statusHistory: { status: string; timestamp: string; note: string }[];
    deliveryPartner: { _id: string; name: string; phone: string; vehicleType: string; vehicleNumber: string; avatar: string } | null;
    deliveryOtp: string; isPaid: boolean; paidAt: string | null; deliveredAt: string | null; createdAt: string;
}
export interface PlaceOrder {
    items: { productId: string; quantity: number }[];
    addressId?: number; paymentMethod: "cod" | "esewa" | "khalti" | "card"; cardLast4?: string;
    couponCode?: string; deliverySlot: string; notes: string;
}
export interface PaymentResult { orderNumber: string; paid: boolean; status: string; message: string }

export interface Profile {
    _id: string; name: string; email: string; phone: string; avatar: string; role: string;
    age: number | null; gender: string; dateOfBirth: string | null; createdAt: string;
}

// ---------- Endpoints ----------

export const shopApi = {
    products: () => get<Product[]>("/api/products?limit=200"),
    product: (id: string) => get<Product>(`/api/products/${id}`),
    related: (id: string) => get<Product[]>(`/api/products/${id}/related?limit=8`),
    reviews: (id: string) => get<ShopReview[]>(`/api/products/${id}/reviews`),
    addReview: (id: string, rating: number, comment: string) => post<ShopReview>(`/api/products/${id}/reviews`, { rating, comment }),
    categories: () => get<ShopCategory[]>("/api/categories"),
    settings: () => get<StoreSettings>("/api/store/settings"),

    validateCoupon: (code: string, subtotal: number) => post<CouponResult>("/api/coupons/validate", { code, subtotal }),
    placeOrder: (body: PlaceOrder) => post<ShopOrder>("/api/orders", body),
    myOrders: () => get<ShopOrder[]>("/api/orders"),
    order: (no: string) => get<ShopOrder>(`/api/orders/${no}`),
    cancelOrder: (no: string) => put<ShopOrder>(`/api/orders/${no}/cancel`),

    // Payment calls wait up to 60 seconds: the API has to talk to eSewa / Khalti first
    esewaStart: async (orderNumber: string) => (await api.post("/api/payments/esewa/start", { orderNumber }, { timeout: 60000 })) as unknown as { formUrl: string; fields: Record<string, string> },
    esewaVerify: async (data: string) => (await api.post("/api/payments/esewa/verify", { data }, { timeout: 60000 })) as unknown as PaymentResult,
    khaltiStart: async (orderNumber: string) => (await api.post("/api/payments/khalti/start", { orderNumber }, { timeout: 60000 })) as unknown as { paymentUrl: string },
    khaltiVerify: async (pidx: string) => (await api.post("/api/payments/khalti/verify", { pidx }, { timeout: 60000 })) as unknown as PaymentResult,

    addresses: () => get<SavedAddress[]>("/api/addresses"),
    addAddress: (a: SaveAddress) => post<SavedAddress>("/api/addresses", a),
    updateAddress: (id: string, a: SaveAddress) => put<SavedAddress>(`/api/addresses/${id}`, a),
    setDefaultAddress: (id: string) => put<SavedAddress>(`/api/addresses/${id}/default`),
    deleteAddress: (id: string) => del<{ message: string }>(`/api/addresses/${id}`),

    profile: () => get<Profile>("/api/profile"),
    updateProfile: (p: { name: string; phone: string; age: number | null; gender: string; dateOfBirth: string | null; avatar: string }) => put<Profile>("/api/profile", p),
    changePassword: (currentPassword: string, newPassword: string) => put<{ message: string }>("/api/auth/change-password", { currentPassword, newPassword, confirmPassword: newPassword }),
    // Changes the login email; the API sends back a new token, which is saved
    changeEmail: async (newEmail: string, password: string) => {
        const res = await put<{ token: string }>("/api/auth/change-email", { newEmail, password });
        localStorage.setItem("accessToken", res.token);
        return authService.me();
    },
};

// ---------- Shared data hooks (loaded once, reused by every page) ----------

// Local category pictures are used when a category has no image in the database
const localImage = (slug: string) => categoriesData.find(c => c.slug === slug)?.image ?? "";

let productsCache: Promise<Product[]> | null = null;
let categoriesCache: Promise<ShopCategory[]> | null = null;
let settingsCache: Promise<StoreSettings> | null = null;

export const refreshShopData = () => { productsCache = null; categoriesCache = null; settingsCache = null; };

function useCached<T>(load: () => Promise<T>, empty: T) {
    const [data, setData] = useState<T>(empty);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        let alive = true;
        load().then(d => { if (alive) setData(d); })
            .catch(e => { if (alive) setError(shopError(e, "Could not load data")); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);   // eslint-disable-line react-hooks/exhaustive-deps
    return { data, loading, error };
}

// All products that are showing in the shop
export const useProducts = () => {
    const r = useCached(() => {
        productsCache ??= shopApi.products().catch(e => { productsCache = null; throw e; });
        return productsCache;
    }, [] as Product[]);
    return { products: r.data, loading: r.loading, error: r.error };
};

// Active categories (with a picture)
export const useCategories = () => {
    const r = useCached(() => {
        categoriesCache ??= shopApi.categories()
            .then(list => list.filter(c => c.isActive).map(c => ({ ...c, image: c.image || localImage(c.slug) })))
            .catch(e => { categoriesCache = null; throw e; });
        return categoriesCache;
    }, [] as ShopCategory[]);
    return { categories: r.data, loading: r.loading, error: r.error };
};

// Delivery fee, free-delivery limit and tax (from Admin -> Settings)
const defaultSettings: StoreSettings = { storeName: "Pasalmandu", supportEmail: "", supportPhone: "", deliveryFee: 100, freeDeliveryThreshold: 500, taxPercent: 0 };
export const useStoreSettings = () => {
    const r = useCached(() => {
        settingsCache ??= shopApi.settings().catch(e => { settingsCache = null; throw e; });
        return settingsCache;
    }, defaultSettings);
    return { settings: r.data, loading: r.loading };
};

// Same rules as the API: free delivery at the limit or with a free-shipping coupon; tax on (subtotal - discount)
export const priceSummary = (subtotal: number, s: StoreSettings, discount = 0, freeShipping = false) => {
    const deliveryFee = subtotal >= s.freeDeliveryThreshold || freeShipping ? 0 : s.deliveryFee;
    const tax = Math.round((subtotal - discount) * s.taxPercent) / 100;
    return { deliveryFee, tax, total: Math.max(0, subtotal - discount + deliveryFee + tax) };
};

// "PSM-2026-123456" etc. order status order, used by tracking timelines
export const ORDER_STEPS = ["Placed", "Confirmed", "Packed", "Out for Delivery", "Delivered"] as const;

// Colour for each order status
export const statusStyle = (status: string) => {
    switch (status) {
        case "Delivered": return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Cancelled": return "bg-red-50 text-red-600 border-red-200";
        case "Out for Delivery": return "bg-blue-50 text-blue-700 border-blue-200";
        case "Packed": return "bg-violet-50 text-violet-700 border-violet-200";
        case "Awaiting Payment": return "bg-amber-50 text-amber-700 border-amber-200";
        default: return "bg-orange-50 text-app-orange border-orange-200/60";   // Placed / Confirmed
    }
};

export const orderDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

// Sends the customer to eSewa or Khalti to pay an "Awaiting Payment" order.
// eSewa needs a form POST from the browser; Khalti gives a link to open.
export const goToPayment = async (orderNumber: string, method: string) => {
    if (method === "esewa") {
        const { formUrl, fields } = await shopApi.esewaStart(orderNumber);
        const form = document.createElement("form");
        form.method = "POST";
        form.action = formUrl;
        Object.entries(fields).forEach(([name, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
    } else if (method === "khalti") {
        const { paymentUrl } = await shopApi.khaltiStart(orderNumber);
        window.location.href = paymentUrl;
    }
};
