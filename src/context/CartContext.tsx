import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

import type { ReactNode } from "react";
import type { Product } from "../types";
import { api } from "../services/authServices";

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartApiItem {
    id: number;
    product: {
        _id: string;
        id: string;
        name: string;
        price: number;
        image: string;
        unit: string;
    };
    quantity: number;
}

interface CartApiResponse {
    id: number;
    userId: string;
    username?: string;
    items: CartApiItem[];
}

interface CartContextValue {
    items: CartItem[];
    cartCount: number;
    cartTotal: number;
    isLoading: boolean;

    addToCart: (product: Product) => Promise<void>;

    addToCartWithQty: (
        product: Product,
        quantity: number
    ) => Promise<void>;

    removeFromCart: (productId: string) => Promise<void>;

    updateQuantity: (
        productId: string,
        quantity: number
    ) => Promise<void>;

    clearCart: () => Promise<void>;

    getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const isLoggedIn = () => {
    return Boolean(localStorage.getItem("accessToken"));
};

const getProductId = (product: Product) => {
    return String(product._id || product.id || "");
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load the logged-in user's cart from the backend.
    const loadCart = useCallback(async () => {
        if (!isLoggedIn()) {
            setItems([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const response = await api.get("/api/cart");

            // Your existing Axios response interceptor
            // already returns response.data.
            const cart = response as unknown as CartApiResponse;

            const mappedItems: CartItem[] = (
                cart.items || []
            ).map((item) => ({
                product: item.product as unknown as Product,
                quantity: item.quantity,
            }));

            setItems(mappedItems);
        } catch (error) {
            console.error("Failed to load cart:", error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load cart when the application starts.
    useEffect(() => {
        void loadCart();
    }, [loadCart]);

    // Synchronize cart with existing login/logout events.
    useEffect(() => {
        const handleUserUpdate = () => {
            if (isLoggedIn()) {
                void loadCart();
            } else {
                setItems([]);
                setIsLoading(false);
            }
        };

        window.addEventListener(
            "pasalmandu:user-updated",
            handleUserUpdate
        );

        return () => {
            window.removeEventListener(
                "pasalmandu:user-updated",
                handleUserUpdate
            );
        };
    }, [loadCart]);

    // Add a product.
    const addToCartWithQty = async (
        product: Product,
        quantity: number
    ) => {
        if (!isLoggedIn()) {
            window.location.assign("/login");
            return;
        }

        const productId = Number(getProductId(product));

        if (
            !Number.isInteger(productId) ||
            productId <= 0 ||
            quantity <= 0
        ) {
            return;
        }

        await api.post("/api/cart/items", {
            productId,
            quantity,
        });

        await loadCart();
    };

    const addToCart = async (product: Product) => {
        await addToCartWithQty(product, 1);
    };

    // Update quantity.
    const updateQuantity = async (
        productId: string,
        quantity: number
    ) => {
        if (!isLoggedIn()) {
            window.location.assign("/login");
            return;
        }

        const id = Number(productId);

        if (!Number.isInteger(id) || id <= 0) return;

        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }

        await api.put(`/api/cart/items/${id}`, {
            quantity,
        });

        await loadCart();
    };

    // Remove one product.
    const removeFromCart = async (productId: string) => {
        if (!isLoggedIn()) {
            window.location.assign("/login");
            return;
        }

        const id = Number(productId);

        if (!Number.isInteger(id) || id <= 0) return;

        await api.delete(`/api/cart/items/${id}`);

        await loadCart();
    };

    // Clear all items, preserving the cart record.
    const clearCart = async () => {
        if (!isLoggedIn()) {
            setItems([]);
            return;
        }

        await api.delete("/api/cart");

        setItems([]);
    };

    // Cart calculations.
    const cartCount = items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const cartTotal = items.reduce(
        (total, item) =>
            total + item.product.price * item.quantity,
        0
    );

    const getItemQuantity = (productId: string) => {
        const item = items.find(
            (item) => getProductId(item.product) === String(productId)
        );

        return item?.quantity ?? 0;
    };

    return (
        <CartContext.Provider
            value={{
                items,
                cartCount,
                cartTotal,
                isLoading,
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

export const useCart = () => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            "useCart must be used inside CartProvider"
        );
    }

    return context;
};

export const useOptionalCart = () => {
    return useContext(CartContext);
};