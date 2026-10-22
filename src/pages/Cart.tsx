import { Link, useNavigate } from "react-router-dom";
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    ArrowLeft,
    ShoppingBag,
    Tag,
    Truck,
    ChevronRight,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useStoreSettings } from "../services/shopApi";


const Cart = () => {
    const navigate = useNavigate();
    const { items, cartTotal, removeFromCart, updateQuantity } = useCart();
    // Delivery fee and free-delivery limit come from Admin -> Settings
    const { settings } = useStoreSettings();
    const DELIVERY_FEE = settings.deliveryFee;
    const FREE_DELIVERY_THRESHOLD = settings.freeDeliveryThreshold;
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs";

    const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const tax = Math.round(cartTotal * settings.taxPercent) / 100;     // same rule as the API
    const grandTotal = cartTotal + deliveryFee + tax;

    // ── Empty State ──────────────────────────────────────────────────────────
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-app-cream flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-app-border p-10 text-center animate-fade-in">
                    <div className="size-20 rounded-full bg-orange-50 flex-center mx-auto mb-6">
                        <ShoppingCart className="size-10 text-app-orange opacity-70" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">Your cart is empty</h2>
                    <p className="text-zinc-500 text-sm mb-8">
                        Add some products to your cart to continue shopping.
                    </p>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-app-orange hover:bg-app-orange-dark text-white font-semibold rounded-2xl transition-colors"
                    >
                        <ShoppingBag className="size-4" /> Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    // ── Filled Cart ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-app-cream pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-zinc-500 hover:text-app-green transition-colors"
                    >
                        <ArrowLeft className="size-4" /> Back
                    </button>
                    <ChevronRight className="size-3 text-zinc-400" />
                    <span className="text-zinc-700 font-medium">Shopping Cart</span>
                </div>

                {/* Page Title */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 flex items-center gap-3">
                        <ShoppingCart className="size-7 text-app-orange" />
                        Shopping Cart
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {items.length} {items.length === 1 ? "item" : "items"} in your cart
                    </p>
                </div>

                {/* Main Layout */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* ── Left: Cart Items ───────────────────────────────── */}
                    <div className="flex-1 w-full space-y-4">
                        {items.map((item) => {
                            const subtotal = item.product.price * item.quantity;
                            const productId = item.product._id;

                            return (
                                <div
                                    key={productId}
                                    className="bg-white rounded-2xl border border-app-border shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in"
                                >
                                    {/* Product Image */}
                                    <Link
                                        to={`/product/${item.product.id ?? productId}`}
                                        className="size-20 sm:size-24 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0 block"
                                    >
                                        <img
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-full h-full object-contain p-2"
                                        />
                                    </Link>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={`/product/${item.product.id ?? productId}`}
                                            className="text-sm sm:text-base font-semibold text-zinc-900 hover:text-app-green transition-colors line-clamp-2"
                                        >
                                            {item.product.name}
                                        </Link>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {currency} {item.product.price.toFixed(1)} / {item.product.unit}
                                        </p>

                                        {/* Mobile: quantity + subtotal inline */}
                                        <div className="flex items-center justify-between mt-3 sm:hidden">
                                            <QuantityStepper
                                                qty={item.quantity}
                                                onDecrease={() =>
                                                    updateQuantity(productId, item.quantity - 1)
                                                }
                                                onIncrease={() =>
                                                    updateQuantity(productId, item.quantity + 1)
                                                }
                                            />
                                            <span className="text-sm font-bold text-app-green">
                                                {currency} {subtotal.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Desktop: quantity, subtotal, remove */}
                                    <div className="hidden sm:flex items-center gap-6 shrink-0">
                                        <QuantityStepper
                                            qty={item.quantity}
                                            onDecrease={() =>
                                                updateQuantity(productId, item.quantity - 1)
                                            }
                                            onIncrease={() =>
                                                updateQuantity(productId, item.quantity + 1)
                                            }
                                        />

                                        <div className="w-24 text-right">
                                            <p className="text-xs text-zinc-400 mb-0.5">Subtotal</p>
                                            <p className="text-base font-bold text-app-green">
                                                {currency} {subtotal.toFixed(1)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        onClick={() => removeFromCart(productId)}
                                        className="shrink-0 size-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex-center transition-colors"
                                        title="Remove from cart"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            );
                        })}

                        {/* Continue Shopping */}
                        <div className="pt-2">
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-2 text-sm font-medium text-app-green hover:text-app-green-light transition-colors"
                            >
                                <ArrowLeft className="size-4" /> Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* ── Right: Cart Summary ────────────────────────────── */}
                    <div className="w-full lg:w-80 xl:w-96 shrink-0">
                        <div className="bg-white rounded-2xl border border-app-border shadow-xs p-5 sm:p-6 sticky top-20 space-y-5">
                            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                <Tag className="size-5 text-app-orange" /> Cart Summary
                            </h2>

                            {/* Line items */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-zinc-600">
                                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                    <span className="font-medium text-zinc-900">
                                        {currency} {cartTotal.toFixed(1)}
                                    </span>
                                </div>

                                <div className="flex justify-between text-zinc-600">
                                    <span className="flex items-center gap-1.5">
                                        <Truck className="size-3.5 text-zinc-400" /> Delivery Fee
                                    </span>
                                    {deliveryFee === 0 ? (
                                        <span className="text-app-success font-semibold">FREE</span>
                                    ) : (
                                        <span className="font-medium text-zinc-900">
                                            {currency} {deliveryFee.toFixed(1)}
                                        </span>
                                    )}
                                </div>

                                {tax > 0 && (
                                    <div className="flex justify-between text-zinc-600">
                                        <span>Tax ({settings.taxPercent}%)</span>
                                        <span className="font-medium text-zinc-900">{currency} {tax.toFixed(1)}</span>
                                    </div>
                                )}

                                {deliveryFee > 0 && (
                                    <p className="text-xs text-zinc-400">
                                        Add {currency} {(FREE_DELIVERY_THRESHOLD - cartTotal).toFixed(1)} more for free delivery
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-app-border pt-4 flex justify-between items-center">
                                <span className="text-base font-bold text-zinc-900">Grand Total</span>
                                <span className="text-xl font-bold text-app-green">
                                    {currency} {grandTotal.toFixed(1)}
                                </span>
                            </div>

                            {/* Savings callout */}
                            {deliveryFee === 0 && (
                                <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-xs font-semibold text-emerald-800 text-center">
                                    🎉 You qualify for free delivery!
                                </div>
                            )}

                            {/* Checkout Button */}
                            <Link
                                to="/checkout"
                                className="w-full py-3.5 bg-app-green hover:bg-app-green-light text-white font-semibold rounded-2xl flex-center gap-2 text-sm transition-colors shadow-xs"
                            >
                                Proceed to Checkout <ChevronRight className="size-4" />
                            </Link>

                            {/* Trust badges */}
                            <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 pt-1">
                                <span>🔒 Secure checkout</span>
                                <span>•</span>
                                <span>📦 Fast delivery</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Quantity Stepper Sub-component ────────────────────────────────────────────

interface StepperProps {
    qty: number;
    onDecrease: () => void;
    onIncrease: () => void;
}

const QuantityStepper = ({ qty, onDecrease, onIncrease }: StepperProps) => (
    <div className="flex items-center gap-2 bg-zinc-50 border border-app-border rounded-xl p-1">
        <button
            onClick={onDecrease}
            disabled={qty <= 1}
            className="size-8 rounded-lg bg-white hover:bg-zinc-100 disabled:opacity-40 text-zinc-800 flex-center transition-all shadow-2xs active:scale-95"
        >
            <Minus className="size-3.5" />
        </button>
        <span className="text-sm font-bold text-zinc-900 w-6 text-center select-none">{qty}</span>
        <button
            onClick={onIncrease}
            className="size-8 rounded-lg bg-app-orange hover:bg-app-orange-dark text-white flex-center transition-all shadow-2xs active:scale-95"
        >
            <Plus className="size-3.5" />
        </button>
    </div>
);

export default Cart;
