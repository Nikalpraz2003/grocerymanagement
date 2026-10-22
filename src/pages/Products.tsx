import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { HomeIcon, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useCategories, useProducts } from "../services/shopApi";
import ProductCard from "../components/common/ProductCard";
import type { Product as ProductType } from "../types";

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedCategory = searchParams.get("category") || "all";
    const { products, loading, error } = useProducts();
    const { categories: categoriesData } = useCategories();

    const [minPrice, setMinPrice] = useState<string>("");
    const [maxPrice, setMaxPrice] = useState<string>("");
    const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "rating">("newest");
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    const handleCategoryChange = (slug: string) => {
        if (slug === "all") {
            searchParams.delete("category");
            setSearchParams(searchParams);
        } else {
            setSearchParams({ category: slug });
        }
    };

    // Filter & Sort Logic
    const filteredProducts = useMemo(() => {
        return products
            .filter((p: ProductType) => {
                if (selectedCategory !== "all" && p.category !== selectedCategory) {
                    return false;
                }
                const min = parseFloat(minPrice);
                const max = parseFloat(maxPrice);
                if (!isNaN(min) && p.price < min) return false;
                if (!isNaN(max) && p.price > max) return false;
                return true;
            })
            .sort((a: ProductType, b: ProductType) => {
                if (sortBy === "price-asc") return a.price - b.price;
                if (sortBy === "price-desc") return b.price - a.price;
                if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [products, selectedCategory, minPrice, maxPrice, sortBy]);

    const selectedCategoryName =
        selectedCategory === "all"
            ? "All Products"
            : categoriesData.find((c) => c.slug === selectedCategory)?.name || "All Products";

    return (
        <div className="min-h-screen bg-[#FAF7F2] pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-6">
                    <Link to="/" className="hover:text-app-green flex items-center gap-1">
                        <HomeIcon className="size-3.5" />
                    </Link>
                    <ChevronRight className="size-3 text-zinc-400" />
                    <span className="text-zinc-700 font-medium">{selectedCategoryName}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left Sidebar Filter */}
                    <div className="hidden lg:block w-64 shrink-0 space-y-6">
                        {/* Categories Box */}
                        <div className="bg-white rounded-2xl p-5 shadow-xs border border-zinc-100/80">
                            <h3 className="font-bold text-zinc-900 text-sm mb-4">Categories</h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => handleCategoryChange("all")}
                                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                                        selectedCategory === "all"
                                            ? "bg-[#1B3022] text-white"
                                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                    }`}
                                >
                                    All Categories
                                </button>
                                {categoriesData.map((cat) => (
                                    <button
                                        key={cat.slug}
                                        onClick={() => handleCategoryChange(cat.slug)}
                                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                                            selectedCategory === cat.slug
                                                ? "bg-[#1B3022] text-white"
                                                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range Box */}
                        <div className="bg-white rounded-2xl p-5 shadow-xs border border-zinc-100/80">
                            <h3 className="font-bold text-zinc-900 text-sm mb-3">Price Range</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-app-green focus:outline-none"
                                />
                                <span className="text-zinc-400 text-xs">—</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-app-green focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile filter toggle */}
                    <div className="w-full lg:hidden flex items-center justify-between gap-4">
                        <button
                            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                            className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium flex items-center gap-2 text-zinc-700 shadow-2xs"
                        >
                            <SlidersHorizontal className="size-3.5" /> Filters
                        </button>
                    </div>

                    {mobileFilterOpen && (
                        <div className="w-full lg:hidden bg-white p-4 rounded-2xl border border-zinc-200 space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-zinc-800 mb-2">Category</h4>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                                >
                                    <option value="all">All Categories</option>
                                    {categoriesData.map((c) => (
                                        <option key={c.slug} value={c.slug}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min Price"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-1/2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                                />
                                <input
                                    type="number"
                                    placeholder="Max Price"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-1/2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {/* Right Main Catalog Content */}
                    <div className="flex-1 w-full space-y-6">
                        {/* Header with Title, Count, and Sort Dropdown */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900 font-sans">
                                    {selectedCategoryName}
                                </h1>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
                                </p>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                    className="bg-white border border-zinc-200/90 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs focus:ring-1 focus:ring-app-green focus:outline-none cursor-pointer"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="rating">Top Rated</option>
                                </select>
                            </div>
                        </div>

                        {/* Product Cards Grid */}
                        {error ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-red-100 text-sm text-red-700">{error}</div>
                        ) : loading ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 text-sm text-zinc-500">Loading products...</div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                                {filteredProducts.map((p) => (
                                    <ProductCard key={p.id || p._id} product={p} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 space-y-3">
                                <p className="text-base font-semibold text-zinc-700">No products match your filter criteria.</p>
                                <p className="text-xs text-zinc-500">Try adjusting your price range or switching category.</p>
                                <button
                                    onClick={() => {
                                        handleCategoryChange("all");
                                        setMinPrice("");
                                        setMaxPrice("");
                                    }}
                                    className="px-4 py-2 bg-app-green text-white text-xs font-semibold rounded-xl"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
