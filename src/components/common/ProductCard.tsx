import type { Product } from "../../types";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";

interface Props {
    product: Product;
}

const ProductCard = ({ product }: Props) => {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs";
    const formattedPrice = `${currency} ${product.price.toFixed(1)}`;
    const formattedOriginalPrice = `${currency} ${product.originalPrice.toFixed(1)}`;
    const navigate = useNavigate();

    const { addToCart, updateQuantity, getItemQuantity } = useCart();
    const qty = getItemQuantity(product._id ?? product.id ?? "");

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(product);
        if (qty === 0) {
            toast.success(`Added ${product.name} to cart!`, {
                icon: "🛒",
                style: { borderRadius: "12px", background: "#1B3022", color: "#fff" },
            });
        }
    };

    const handleDecrease = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateQuantity(product._id ?? product.id ?? "", qty - 1);
    };

    return (
        <div
            className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-md transition-all duration-300 group animate-fade-in cursor-pointer"
            onClick={() => navigate(`/product/${product.id ?? product._id}`)}
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover p-4 group-hover:p-2 transition-all duration-300"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {product.discount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-app-orange text-white rounded-full">
                            {product.discount}% OFF
                        </span>
                    )}
                </div>
            </div>

            {/* Details */}
            <div className="p-3.5 text-zinc-700">
                <h3 className="text-sm leading-snug mb-1.5 line-clamp-2">{product.name}</h3>

                {/* Rating */}
                {product.rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="size-3.5 text-app-warning fill-app-warning" />
                        <span className="text-xs font-medium text-app-text">{product.rating}</span>
                        <span className="text-xs text-app-text-light">({product.reviewCount})</span>
                    </div>
                )}

                {/* Price and Add / Quantity */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 truncate">
                        <span className="text-base font-medium">{formattedPrice}</span>
                        <span className="text-sm text-app-text block">/{product.unit}</span>
                        {product.originalPrice > product.price && (
                            <span className="text-sm text-app-text-light line-through ml-1.5">
                                {formattedOriginalPrice}
                            </span>
                        )}
                    </div>

                    {/* Quantity stepper when in cart, + button when not */}
                    {qty > 0 ? (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={handleDecrease}
                                className="size-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex-center transition-colors active:scale-95"
                            >
                                <Minus className="size-3.5" />
                            </button>
                            <span className="text-sm font-bold text-zinc-900 w-5 text-center">{qty}</span>
                            <button
                                onClick={handleAdd}
                                className="size-7 rounded-full bg-app-orange text-white flex-center shrink-0 hover:bg-app-orange-dark transition-colors active:scale-95"
                            >
                                <Plus className="size-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAdd}
                            className="size-7 rounded-full bg-app-orange text-white flex-center shrink-0 hover:bg-app-orange-dark transition-colors active:scale-95"
                        >
                            <Plus className="size-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
