import { Link } from "react-router-dom";
import { useProducts } from "../services/shopApi";
import ProductCard from "../components/common/ProductCard";
import { Zap, ChevronRight, HomeIcon } from "lucide-react";

const FlashDeals = () => {
    const { products, loading } = useProducts();
    const discountedProducts = products
        .filter((p) => p.discount > 0 || (p.originalPrice && p.originalPrice > p.price))
        .sort((a, b) => b.discount - a.discount);

    return (
        <div className="min-h-screen bg-[#FAF7F2] pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-6">
                    <Link to="/" className="hover:text-app-green flex items-center gap-1">
                        <HomeIcon className="size-3.5" />
                    </Link>
                    <ChevronRight className="size-3 text-zinc-400" />
                    <span className="text-zinc-700 font-medium">Flash Deals</span>
                </div>

                <div className="mb-8 bg-linear-to-r from-[#1B3022] to-emerald-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-semibold rounded-full mb-3">
                            <Zap className="size-3.5 fill-amber-300" /> Limited Time Offers
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-serif">Today&apos;s Flash Deals & Discounts</h1>
                        <p className="text-xs sm:text-sm text-white/70 mt-1">
                            Save big on farm-fresh produce, dairy, bakery items, and pantry staples.
                        </p>
                    </div>
                </div>

                {loading && <p className="text-sm text-zinc-500 mb-4">Loading deals...</p>}
                {!loading && discountedProducts.length === 0 && <p className="text-sm text-zinc-500">No deals right now. Check back soon!</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {discountedProducts.map((product) => (
                        <ProductCard key={product.id || product._id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FlashDeals;
