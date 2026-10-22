import { useMemo } from "react";
import { useProducts } from "../../services/shopApi";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../common/ProductCard";

const PopularProduct = () => {
    const { products: all, loading } = useProducts();
    // Most reviewed / best rated first
    const products = useMemo(() => [...all].sort((a, b) => (b.reviewCount * b.rating) - (a.reviewCount * a.rating)).slice(0, 20), [all]);

    return (
        <section className="pb-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold">Popular Products</h2>
                        <p className="text-sm text-app-text-light">Discover our most popular products</p>
                    </div>

                    <Link
                        to="/products"
                        className="text-sm font-semibold text-app-orange hover:text-app-orange-dark flex items-center gap-1 transition-colors"
                    >
                        Show All <ArrowRightIcon className="size-4" />
                    </Link>
                </div>
                {loading && <p className="text-sm text-zinc-500">Loading products...</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-8">
                    {products.map((product) => (
                        <ProductCard key={product.id || product._id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PopularProduct;
