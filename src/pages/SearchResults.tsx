import { useSearchParams, Link } from "react-router-dom";
import { useProducts } from "../services/shopApi";
import ProductCard from "../components/common/ProductCard";
import { Search, ChevronRight, HomeIcon } from "lucide-react";

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const { products, loading } = useProducts();
    const results = products.filter((product) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            product.name.toLowerCase().includes(q) ||
            product.category.toLowerCase().includes(q) ||
            ((product as { categoryName?: string }).categoryName ?? "").toLowerCase().includes(q) ||
            product.description.toLowerCase().includes(q)
        );
    });

    return (
        <div className="min-h-screen bg-[#FAF7F2] pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-6">
                    <Link to="/" className="hover:text-app-green flex items-center gap-1">
                        <HomeIcon className="size-3.5" />
                    </Link>
                    <ChevronRight className="size-3 text-zinc-400" />
                    <Link to="/products" className="hover:text-app-green">
                        Products
                    </Link>
                    <ChevronRight className="size-3 text-zinc-400" />
                    <span className="text-zinc-700 font-medium">Search Results</span>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Search className="size-6 text-app-orange" />
                        <span>Search results for &ldquo;{query}&rdquo;</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                        {results.length} {results.length === 1 ? "product" : "products"} found matching your query
                    </p>
                </div>

                {loading ? (
                    <p className="text-sm text-zinc-500">Searching...</p>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {results.map((product) => (
                            <ProductCard key={product.id || product._id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 space-y-4">
                        <div className="size-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto text-app-orange">
                            <Search className="size-8" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-zinc-800">No products found</p>
                            <p className="text-xs text-zinc-500 mt-1">
                                We couldn&apos;t find any items matching &ldquo;{query}&rdquo;. Try checking for spelling errors or searching for a broader term.
                            </p>
                        </div>
                        <Link
                            to="/products"
                            className="inline-block px-5 py-2.5 bg-app-green text-white text-xs font-semibold rounded-xl hover:bg-emerald-900 transition-colors"
                        >
                            Browse All Products
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
