import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { Product } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartState {
    items: CartItem[];
}

type CartAction =
    | { type: "ADD_TO_CART"; payload: Product }
    | { type: "ADD_TO_CART_WITH_QTY"; payload: { product: Product; quantity: number } }
    | { type: "REMOVE_FROM_CART"; payload: string }   // product _id
    | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
    | { type: "CLEAR_CART" }
    | { type: "LOAD_CART"; payload: CartItem[] };

interface CartContextValue {
    items: CartItem[];
    cartCount: number;
    cartTotal: number;
    addToCart: (product: Product) => void;
    addToCartWithQty: (product: Product, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getItemQuantity: (productId: string) => number;
}

// ─── Storage Key ──────────────────────────────────────────────────────────────

const CART_STORAGE_KEY = "pasalmandu_cart";

function loadCartFromStorage(): CartItem[] {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as CartItem[];
        // Basic validation
        if (!Array.isArray(parsed)) return [];
        // Products from the database have number ids ("21"); old demo items had long text ids and can't be ordered
        return parsed.filter(
            (item) => item && item.product && /^\d+$/.test(String(item.product._id)) && typeof item.quantity === "number" && item.quantity > 0
        );
    } catch {
        return [];
    }
}

function saveCartToStorage(items: CartItem[]) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
        // silently fail if localStorage is unavailable
    }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case "LOAD_CART":
            return { items: action.payload };

        case "ADD_TO_CART": {
            const existing = state.items.find((i) => i.product._id === action.payload._id);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.product._id === action.payload._id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    ),
                };
            }
            return { items: [...state.items, { product: action.payload, quantity: 1 }] };
        }

        case "ADD_TO_CART_WITH_QTY": {
            const { product, quantity } = action.payload;
            const existing = state.items.find((i) => i.product._id === product._id);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.product._id === product._id
                            ? { ...i, quantity: i.quantity + quantity }
                            : i
                    ),
                };
            }
            return { items: [...state.items, { product, quantity }] };
        }

        case "REMOVE_FROM_CART":
            return { items: state.items.filter((i) => i.product._id !== action.payload) };

        case "UPDATE_QUANTITY": {
            const { id, quantity } = action.payload;
            if (quantity <= 0) {
                return { items: state.items.filter((i) => i.product._id !== id) };
            }
            return {
                items: state.items.map((i) =>
                    i.product._id === id ? { ...i, quantity } : i
                ),
            };
        }

        case "CLEAR_CART":
            return { items: [] };

        default:
            return state;
    }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(cartReducer, { items: [] });

    // Load from localStorage on mount
    useEffect(() => {
        const saved = loadCartFromStorage();
        if (saved.length > 0) {
            dispatch({ type: "LOAD_CART", payload: saved });
        }
    }, []);

    // Persist to localStorage on every change
    useEffect(() => {
        saveCartToStorage(state.items);
    }, [state.items]);

    // Derived values
    const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = state.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    // Actions
    const addToCart = useCallback((product: Product) => {
        dispatch({ type: "ADD_TO_CART", payload: product });
    }, []);

    const addToCartWithQty = useCallback((product: Product, quantity: number) => {
        dispatch({ type: "ADD_TO_CART_WITH_QTY", payload: { product, quantity } });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        dispatch({ type: "REMOVE_FROM_CART", payload: productId });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        dispatch({ type: "UPDATE_QUANTITY", payload: { id: productId, quantity } });
    }, []);

    const clearCart = useCallback(() => {
        dispatch({ type: "CLEAR_CART" });
    }, []);

    const getItemQuantity = useCallback(
        (productId: string): number => {
            return state.items.find((i) => i.product._id === productId)?.quantity ?? 0;
        },
        [state.items]
    );

    return (
        <CartContext.Provider
            value={{
                items: state.items,
                cartCount,
                cartTotal,
                addToCart,
                addToCartWithQty,
                removeFromCart,
                updateQuantity,
                clearCart,
                getItemQuantity,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCart = (): CartContextValue => {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart must be used inside <CartProvider>");
    }
    return ctx;
};
