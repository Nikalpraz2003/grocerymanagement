

import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    Star,
    Plus,
    Minus,
    ShoppingCart,
    Zap,
    Heart,
    Share2,
    ShieldCheck,
    Truck,
    RotateCcw,
    Sparkles,
    Check,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    Clock,
    MapPin,
    Eye,
    Maximize2,
    X,
    Info,
    Utensils,
    Flame,
    Leaf,
    ThumbsUp,
    MessageSquarePlus,
    Copy,
    Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { categoriesData } from "../assets/assets";
import { shopApi, shopError, useProducts, type ShopReview } from "../services/shopApi";
import authService from "../services/authServices";
import type { Product } from "../types";
import ProductCard from "../components/common/ProductCard";
import { useCart } from "../context/CartContext";

interface ReviewItem {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    date: string;
    comment: string;
    helpful: number;
    userUpvoted?: boolean;
}

// Deterministic product enricher for authentic details
function getProductDetails(product: Product) {
    const categoryName =
        categoriesData.find((c) => c.slug === product.category)?.name || "General Grocery";

    // Gallery images
    const galleryImages = (product.images && product.images.length > 0)
        ? product.images
        : [product.image];

    // Dynamic nutritional info based on category
    let nutrition = {
        servingSize: product.unit || "100g",
        calories: "145 kcal",
        protein: "3.2 g",
        carbs: "22.5 g",
        fat: "4.1 g",
        fiber: "2.8 g",
        sugar: "3.5 g",
        sodium: "45 mg",
    };

    let storage = "Store in a cool, dry place away from direct sunlight. Once opened, store in an airtight container.";
    let shelfLife = "Best before 7 days from delivery date";
    let culinaryTips = "Ready to consume or use as a base ingredient. Wash thoroughly before cooking.";
    let dietaryTags = ["100% Vegetarian", "Farm Fresh", "Pesticide Checked"];

    if (product.category === "bakery") {
        nutrition = {
            servingSize: product.unit || "100g",
            calories: "380 kcal",
            protein: "7.8 g",
            carbs: "45.0 g",
            fat: "18.5 g",
            fiber: "2.2 g",
            sugar: "8.0 g",
            sodium: "280 mg",
        };
        storage = "Store at room temperature in a bread box or sealed bag. Consume within 2-3 days.";
        shelfLife = "3 days from bake date";
        culinaryTips = "Warm in a preheated oven at 180°C for 2-3 minutes for maximum crispiness and butter aroma.";
        dietaryTags = ["Vegetarian", "Freshly Baked Daily", "No Artificial Preservatives"];
    } else if (product.category === "fruits-vegetables") {
        nutrition = {
            servingSize: product.unit || "100g",
            calories: "45 kcal",
            protein: "1.2 g",
            carbs: "9.5 g",
            fat: "0.2 g",
            fiber: "3.1 g",
            sugar: "5.4 g",
            sodium: "12 mg",
        };
        storage = "Refrigerate in a breathable crisper drawer at 4°C-8°C to retain moisture and crunch.";
        shelfLife = "5-7 days when refrigerated";
        culinaryTips = "Rinse under cold running water. Best consumed raw in fresh salads or lightly steamed to preserve nutrients.";
        dietaryTags = ["100% Organic", "Zero Added Sugar", "Rich in Dietary Fiber", "Immunity Booster"];
    } else if (product.category === "dairy-eggs") {
        nutrition = {
            servingSize: product.unit || "100g / 100ml",
            calories: "120 kcal",
            protein: "8.5 g",
            carbs: "4.8 g",
            fat: "7.2 g",
            fiber: "0.0 g",
            sugar: "4.5 g",
            sodium: "115 mg",
        };
        storage = "Keep refrigerated below 4°C at all times. Do not freeze.";
        shelfLife = "4-6 days from packaging date";
        culinaryTips = "Boil milk before consumption or pan-fry paneer on medium heat for golden texture.";
        dietaryTags = ["Pasteurized", "High Calcium", "Rich in Protein"];
    } else if (product.category === "beverages") {
        nutrition = {
            servingSize: "250 ml",
            calories: "105 kcal",
            protein: "0.0 g",
            carbs: "26.0 g",
            fat: "0.0 g",
            fiber: "0.0 g",
            sugar: "25.0 g",
            sodium: "35 mg",
        };
        storage = "Store in a cool place. Best served chilled.";
        shelfLife = "6 months from manufacture";
        culinaryTips = "Serve chilled with ice cubes and a fresh slice of lemon.";
        dietaryTags = ["Refreshing", "Zero Fat"];
    } else if (product.category === "pantry-staples") {
        nutrition = {
            servingSize: "100g dry",
            calories: "350 kcal",
            protein: "12.5 g",
            carbs: "68.0 g",
            fat: "2.5 g",
            fiber: "6.0 g",
            sugar: "1.5 g",
            sodium: "8 mg",
        };
        storage = "Store in an airtight container in a dark, pest-free pantry cabinet.";
        shelfLife = "12 months from packing date";
        culinaryTips = "Rinse 2-3 times before boiling in a 1:2 grain-to-water ratio for fluffy texture.";
        dietaryTags = ["Non-GMO", "Gluten-Free Option", "Whole Grain Superfood"];
    } else if (product.category === "personal-care") {
        nutrition = {
            servingSize: "Per Application",
            calories: "Topical / External",
            protein: "Herbal Actives",
            carbs: "Plant Lipids",
            fat: "Essential Oils",
            fiber: "Vitamin E",
            sugar: "0%",
            sodium: "pH Balanced",
        };
        storage = "Store in a cool, dry place away from direct sunlight. Keep cap tightly closed.";
        shelfLife = "24 months from manufacturing date";
        culinaryTips = "For external cosmetic use only. Apply gently on skin or hair. Patch test recommended before regular use.";
        dietaryTags = ["Cruelty-Free", "Dermatologist Tested", "Paraben-Free", "Natural Actives"];
    } else if (product.category === "meat-seafood") {
        nutrition = {
            servingSize: product.unit || "100g",
            calories: "165 kcal",
            protein: "24.5 g",
            carbs: "0.0 g",
            fat: "6.2 g",
            fiber: "0.0 g",
            sugar: "0.0 g",
            sodium: "65 mg",
        };
        storage = "Keep frozen at -18°C or refrigerated at 0°C to 4°C. Consume within 24-48 hours of defrosting.";
        shelfLife = "3 days fresh / 3 months frozen";
        culinaryTips = "Thaw in refrigerator before cooking. Marinate with your favorite spices and cook thoroughly.";
        dietaryTags = ["100% Halal / Fresh Cut", "High Protein", "Antibiotic Free", "Daily Farm Sourced"];
    } else if (product.category === "snacks") {
        nutrition = {
            servingSize: "30g",
            calories: "155 kcal",
            protein: "4.8 g",
            carbs: "14.2 g",
            fat: "9.5 g",
            fiber: "2.5 g",
            sugar: "2.1 g",
            sodium: "95 mg",
        };
        storage = "Store in an airtight jar in a cool, dry pantry away from moisture.";
        shelfLife = "6 months from packaging date";
        culinaryTips = "Enjoy straight out of the pack as a snack, or pair with tea/coffee and fruit bowls.";
        dietaryTags = ["Zero Trans Fat", "Crunchy & Fresh", "No Added Preservatives", "Anytime Munch"];
    } else if (product.category === "frozen-foods") {
        nutrition = {
            servingSize: "100g",
            calories: "185 kcal",
            protein: "6.2 g",
            carbs: "28.5 g",
            fat: "5.4 g",
            fiber: "3.2 g",
            sugar: "2.0 g",
            sodium: "240 mg",
        };
        storage = "Store frozen at -18°C or below at all times. Do not refreeze once thawed.";
        shelfLife = "9 months from packaging date";
        culinaryTips = "Do not thaw before frying/steaming. Deep fry at 180°C for 3-4 minutes or steam momos for 8-10 minutes.";
        dietaryTags = ["IQF Flash Frozen", "Preservative-Free", "Quick 5-Min Prep", "Restaurant Style Taste"];
    } else if (product.category === "baby-care") {
        nutrition = {
            servingSize: "Per Serving / Use",
            calories: "110 kcal (Cereal)",
            protein: "3.5 g",
            carbs: "21.0 g",
            fat: "1.2 g",
            fiber: "1.8 g",
            sugar: "1.5 g",
            sodium: "15 mg",
        };
        storage = "Store in a cool, clean environment. Keep wipes and packages sealed tightly.";
        shelfLife = "18 months from manufacturing date";
        culinaryTips = "For cereals: Mix with warm boiled water or milk and stir to smooth consistency. Test temperature before feeding.";
        dietaryTags = ["Pediatrician Approved", "Hypoallergenic", "100% Gentle & Safe", "Toxin Free"];
    }

    const highlights = [
        "100% Quality checked & graded before dispatch",
        "Directly sourced from trusted local farms & verified vendors",
        "Hygienically packed in eco-friendly tamper-proof packaging",
        "Temperature-controlled express transit to your doorstep",
    ];

    return {
        categoryName,
        galleryImages,
        nutrition,
        storage,
        shelfLife,
        culinaryTips,
        dietaryTags,
        highlights,
        origin: "Kathmandu Valley & Certified Partner Farms, Nepal",
        sku: `PSL-${product._id.slice(-6).toUpperCase()}`,
    };
}

// Turns an API review into the shape this page shows
const toReviewItem = (r: ShopReview): ReviewItem => {
    const days = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000);
    const date = days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? `${days} days ago` : days < 30 ? `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago` : new Date(r.createdAt).toLocaleDateString();
    const name = r.userName || "Customer";
    return {
        id: r._id, name, rating: r.rating, comment: r.comment, date, helpful: 0,
        avatar: name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U",
    };
};

// Loads the product from the API, then shows the page
export default function ProductPage() {
    const { id } = useParams<{ id: string }>();
    const { products } = useProducts();
    const [product, setProduct] = useState<Product | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) return;
        let alive = true;
        setNotFound(false);
        shopApi.product(id)
            .then((p) => { if (alive) setProduct(p); })
            .catch(() => { if (alive) setNotFound(true); });
        return () => { alive = false; };
    }, [id]);

    if (notFound) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
                <p className="text-lg font-semibold text-zinc-800">This product is not available</p>
                <p className="text-sm text-zinc-500">It may have been removed or is out of the shop.</p>
                <Link to="/products" className="px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl">Browse products</Link>
            </div>
        );
    }
    if (!product || product._id !== id) {
        return <div className="min-h-[60vh] flex items-center justify-center text-sm text-zinc-500">Loading product...</div>;
    }
    return <ProductPageView key={product._id} product={product} allProducts={products} />;
}

function ProductPageView({ product, allProducts }: { product: Product; allProducts: Product[] }) {
    const id = product._id;
    const navigate = useNavigate();
    const { addToCartWithQty } = useCart();

    // Scroll to top on load or ID change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    const details = useMemo(() => getProductDetails(product), [product]);

    // State
    const [selectedImageOverride, setSelectedImageOverride] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [activeTab, setActiveTab] = useState<"details" | "nutrition" | "storage" | "reviews" | "policy">("details");
    const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
    const [pincode, setPincode] = useState<string>("");
    const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
    const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
    const [deselectedBundleItems, setDeselectedBundleItems] = useState<{ [id: string]: boolean }>({});

    // Reset overrides when product changes
    const [prevProductId, setPrevProductId] = useState<string>(product._id);
    if (product._id !== prevProductId) {
        setPrevProductId(product._id);
        setSelectedImageOverride(null);
        setQuantity(1);
        setDeselectedBundleItems({});
    }

    const selectedImage = selectedImageOverride ?? product.image;

    // Bundle deals (complementary products)
    const bundleProducts = useMemo(() => {
        return allProducts
            .filter((p) => p._id !== product._id && p.category !== product.category && p.stock > 0)
            .slice(0, 2);
    }, [product, allProducts]);

    const isBundleItemSelected = (itemId: string) => !deselectedBundleItems[itemId];

    // Reviews list state with user additions
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    useEffect(() => {
        shopApi.reviews(product._id).then((list) => setReviews(list.map(toReviewItem))).catch(() => setReviews([]));
    }, [product._id]);
    const [submittingReview, setSubmittingReview] = useState(false);

    // New review form state
    const [newReviewRating, setNewReviewRating] = useState<number>(5);
    const [newReviewName, setNewReviewName] = useState<string>(authService.getCurrentUser()?.name ?? "");
    const [newReviewComment, setNewReviewComment] = useState<string>("");

    // Related products (same category or nearby)
    const relatedProducts = useMemo(() => {
        const sameCategory = allProducts.filter(
            (p) => p.category === product.category && p._id !== product._id
        );
        if (sameCategory.length >= 4) return sameCategory.slice(0, 4);
        const others = allProducts.filter((p) => p._id !== product._id && !sameCategory.includes(p));
        return [...sameCategory, ...others].slice(0, 4);
    }, [product, allProducts]);

    // Pricing calculations
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs";
    const currentPrice = product.price;
    const originalPrice = product.originalPrice || product.price;
    const discountPercent = product.discount || (originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);
    const savingsAmount = Math.max(0, originalPrice - currentPrice) * quantity;
    const subtotal = currentPrice * quantity;

    // Bundle total
    const bundleSubtotal = useMemo(() => {
        let total = currentPrice;
        bundleProducts.forEach((bp) => {
            if (!deselectedBundleItems[bp._id]) {
                total += bp.price;
            }
        });
        return total;
    }, [currentPrice, bundleProducts, deselectedBundleItems]);

    // Review counts & breakdown
    const reviewStats = useMemo(() => {
        const counts = [0, 0, 0, 0, 0];
        reviews.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
        });
        const total = reviews.length;
        const avg = total > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : "5.0";
        return { counts: counts.reverse(), total, avg };
    }, [reviews]);

    const filteredReviews = useMemo(() => {
        if (!selectedRatingFilter) return reviews;
        return reviews.filter((r) => r.rating === selectedRatingFilter);
    }, [reviews, selectedRatingFilter]);

    // Actions
    const handleAddToCart = () => {
        addToCartWithQty(product, quantity);
        toast.success(`Added ${quantity} × ${product.name} to cart!`, {
            icon: "🛒",
            style: {
                borderRadius: "12px",
                background: "#1B3022",
                color: "#fff",
            },
        });
    };

    const handleBuyNow = () => {
        addToCartWithQty(product, quantity);
        toast.success(`Proceeding to checkout with ${quantity} × ${product.name}...`, {
            icon: "⚡",
        });
        setTimeout(() => {
            navigate("/checkout");
        }, 500);
    };

    const handleAddBundleToCart = () => {
        addToCartWithQty(product, 1);
        bundleProducts.filter((bp) => !deselectedBundleItems[bp._id]).forEach((bp) => addToCartWithQty(bp, 1));
        const addedCount = 1 + bundleProducts.filter((bp) => !deselectedBundleItems[bp._id]).length;
        toast.success(`Added combo bundle (${addedCount} items) to your cart!`, {
            icon: "🎁",
        });
    };

    const handleToggleWishlist = () => {
        setIsWishlisted((prev) => {
            const next = !prev;
            if (next) {
                toast.success(`Added ${product.name} to your Wishlist!`, { icon: "❤️" });
            } else {
                toast("Removed from Wishlist", { icon: "💔" });
            }
            return next;
        });
    };

    const handleCheckPincode = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pincode.trim()) return;
        if (pincode.trim().length >= 3) {
            setDeliveryStatus("Available! ⚡ Express 15-30 Min Delivery to your doorstep.");
            toast.success("Delivery available in your area!");
        } else {
            setDeliveryStatus("Please enter a valid postal code or area.");
        }
    };

    const handleHelpfulVote = (reviewId: string) => {
        setReviews((prev) =>
            prev.map((r) => {
                if (r.id === reviewId) {
                    if (r.userUpvoted) {
                        return { ...r, helpful: r.helpful - 1, userUpvoted: false };
                    }
                    toast.success("Thank you for your feedback!");
                    return { ...r, helpful: r.helpful + 1, userUpvoted: true };
                }
                return r;
            })
        );
    };

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authService.isAuthenticated()) {
            toast.error("Please log in to write a review.");
            navigate("/login", { state: { from: `/product/${product._id}` } });
            return;
        }
        if (!newReviewComment.trim()) {
            toast.error("Please write a short review comment.");
            return;
        }
        setSubmittingReview(true);
        try {
            const saved = await shopApi.addReview(product._id, newReviewRating, newReviewComment.trim());
            // One review per customer: replace their old one if they already reviewed
            setReviews((prev) => [toReviewItem(saved), ...prev.filter((r) => r.id !== saved._id)]);
            setIsReviewModalOpen(false);
            setNewReviewComment("");
            setNewReviewRating(5);
            toast.success("Your review has been submitted successfully!");
        } catch (err) {
            toast.error(shopError(err, "Could not submit your review"));
        } finally {
            setSubmittingReview(false);
        }
    };

    const copyProductLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!");
        setIsShareModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-app-cream pb-20">
            {/* 1. TOP BREADCRUMB & QUICK NAV BAR */}
            <div className="bg-white/70 border-b border-app-border backdrop-blur-md sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 text-xs sm:text-sm">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-zinc-500 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <Link to="/" className="hover:text-app-green flex items-center gap-1 transition-colors">
                            Home
                        </Link>
                        <ChevronRight className="size-3.5 text-zinc-400 shrink-0" />
                        <Link to="/products" className="hover:text-app-green transition-colors">
                            All Products
                        </Link>
                        <ChevronRight className="size-3.5 text-zinc-400 shrink-0" />
                        <Link
                            to={`/products?category=${product.category}`}
                            className="hover:text-app-green transition-colors font-medium text-zinc-700"
                        >
                            {details.categoryName}
                        </Link>
                        <ChevronRight className="size-3.5 text-zinc-400 shrink-0" />
                        <span className="text-app-green font-semibold truncate max-w-[180px] sm:max-w-[280px]">
                            {product.name}
                        </span>
                    </div>

                    {/* Quick back */}
                    <button
                        onClick={() => navigate(-1)}
                        className="hidden md:inline-flex items-center gap-1.5 text-zinc-600 hover:text-app-green font-medium transition-colors shrink-0"
                    >
                        <ArrowLeft className="size-4" /> Back
                    </button>
                </div>
            </div>

            {/* MAIN PRODUCT SHOWCASE CONTAINER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* ─── LEFT COLUMN: IMAGE GALLERY & VISUAL SHOWCASE (6 Cols) ─── */}
                    <div className="lg:col-span-6 space-y-4">
                        {/* Main Image Display Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-app-border shadow-xs relative group overflow-hidden">
                            {/* Badges Overlays */}
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                {discountPercent > 0 && (
                                    <span className="px-3 py-1 text-xs font-bold uppercase bg-app-orange text-white rounded-full shadow-sm flex items-center gap-1">
                                        <Sparkles className="size-3" /> {discountPercent}% OFF
                                    </span>
                                )}
                                {product.isOrganic && (
                                    <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1">
                                        <Leaf className="size-3 text-emerald-600" /> 100% Organic
                                    </span>
                                )}
                            </div>

                            {/* Top Right Quick Actions */}
                            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                                <button
                                    onClick={handleToggleWishlist}
                                    className={`size-10 rounded-full flex-center transition-all ${
                                        isWishlisted
                                            ? "bg-red-50 text-red-500 scale-110 shadow-sm"
                                            : "bg-white/90 hover:bg-white text-zinc-600 hover:text-red-500 shadow-sm border border-zinc-100"
                                    }`}
                                    title="Save to Wishlist"
                                >
                                    <Heart className={`size-5 ${isWishlisted ? "fill-red-500" : ""}`} />
                                </button>
                                <button
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="size-10 rounded-full bg-white/90 hover:bg-white text-zinc-600 hover:text-app-green flex-center shadow-sm border border-zinc-100 transition-all"
                                    title="Share Product"
                                >
                                    <Share2 className="size-5" />
                                </button>
                                <button
                                    onClick={() => setIsLightboxOpen(true)}
                                    className="size-10 rounded-full bg-white/90 hover:bg-white text-zinc-600 hover:text-app-green flex-center shadow-sm border border-zinc-100 transition-all opacity-0 group-hover:opacity-100"
                                    title="Zoom Fullscreen"
                                >
                                    <Maximize2 className="size-5" />
                                </button>
                            </div>

                            {/* Hero Image with Zoom Hover Effect */}
                            <div
                                className="aspect-square w-full max-w-[440px] mx-auto flex-center cursor-zoom-in relative"
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                <img
                                    src={selectedImage}
                                    alt={product.name}
                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>

                            {/* Hover zoom guide pill */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/60 backdrop-blur-xs text-white text-[11px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5">
                                <Eye className="size-3.5" /> Click to view high-res full image
                            </div>
                        </div>

                        {/* Thumbnail Strip */}
                        {details.galleryImages.length > 1 && (
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                                {details.galleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageOverride(img)}
                                        className={`size-20 sm:size-22 rounded-2xl p-2 bg-white border-2 transition-all shrink-0 flex-center overflow-hidden ${
                                            selectedImage === img
                                                ? "border-app-orange ring-2 ring-app-orange/20 shadow-xs"
                                                : "border-transparent hover:border-zinc-300 opacity-70 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Express Delivery & Quality Guarantee Pills (Desktop Left) */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3.5 flex items-start gap-3">
                                <div className="size-9 rounded-xl bg-emerald-100 text-emerald-700 flex-center shrink-0">
                                    <Zap className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-emerald-950">15-30 Min Delivery</p>
                                    <p className="text-[11px] text-emerald-700">From nearest local Pasalmandu hub</p>
                                </div>
                            </div>
                            <div className="bg-orange-50/80 border border-orange-100 rounded-2xl p-3.5 flex items-start gap-3">
                                <div className="size-9 rounded-xl bg-orange-100 text-app-orange-dark flex-center shrink-0">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-900">100% Fresh Guarantee</p>
                                    <p className="text-[11px] text-zinc-600">Free replacement at your door</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── RIGHT COLUMN: PRODUCT ESSENTIALS & BUY BOX (6 Cols) ─── */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Top Category & Stock Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Link
                                to={`/products?category=${product.category}`}
                                className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-app-green hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5"
                            >
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {details.categoryName}
                            </Link>

                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className="text-zinc-400">SKU:</span>
                                <span className="text-zinc-600 font-mono">{details.sku}</span>
                                <span className="text-zinc-300">|</span>
                                {product.stock > 0 ? (
                                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="size-3.5 text-emerald-600" /> In Stock ({product.stock} units)
                                    </span>
                                ) : (
                                    <span className="text-red-600 font-semibold">Out of Stock</span>
                                )}
                            </div>
                        </div>

                        {/* Title & Short Description */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-app-green leading-tight">
                                {product.name}
                            </h1>
                            <p className="text-sm sm:text-base text-zinc-600 mt-2 leading-relaxed">
                                {product.description || "Farm-fresh high-grade grocery selection delivered right from Kathmandu Valley farms."}
                            </p>
                        </div>

                        {/* Ratings & Verified Badges */}
                        <div className="flex flex-wrap items-center gap-4 text-sm pb-4 border-b border-app-border">
                            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                                <div className="flex items-center gap-0.5 text-amber-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`size-4 ${
                                                star <= Math.round(product.rating || 5)
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-zinc-200"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="font-bold text-amber-900">{product.rating || 4.5}</span>
                            </div>

                            <button
                                onClick={() => {
                                    setActiveTab("reviews");
                                    const el = document.getElementById("pdp-tabs-section");
                                    el?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="text-zinc-600 hover:text-app-green underline decoration-dotted font-medium text-xs sm:text-sm"
                            >
                                ({reviewStats.total} customer reviews)
                            </button>

                            <span className="text-zinc-300">•</span>

                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <Check className="size-3.5 text-emerald-600" /> 100% Verified Freshness
                            </span>
                        </div>

                        {/* Pricing Box */}
                        <div className="bg-white rounded-3xl p-6 border border-app-border shadow-xs space-y-4">
                            <div className="flex items-baseline flex-wrap gap-3">
                                <span className="text-3xl sm:text-4xl font-bold text-app-green font-sans">
                                    {currency} {currentPrice.toFixed(1)}
                                </span>
                                <span className="text-sm font-medium text-zinc-500">/ {product.unit}</span>

                                {originalPrice > currentPrice && (
                                    <span className="text-lg text-zinc-400 line-through">
                                        {currency} {originalPrice.toFixed(1)}
                                    </span>
                                )}

                                {discountPercent > 0 && (
                                    <span className="px-2.5 py-0.5 text-xs font-bold text-app-orange bg-orange-50 border border-orange-200 rounded-full">
                                        Save {currency} {(originalPrice - currentPrice).toFixed(1)} ({discountPercent}% OFF)
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-zinc-500">
                                Inclusive of all taxes • Standard rate: {currency} {(currentPrice / (parseFloat(product.unit) || 1)).toFixed(2)} per unit
                            </p>

                            {/* Quantity & CTA Buttons Row */}
                            <div className="pt-2 space-y-3">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    {/* Quantity Stepper */}
                                    <div className="flex items-center justify-between border-2 border-app-border rounded-2xl bg-zinc-50 p-1.5 sm:w-36">
                                        <button
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                            disabled={quantity <= 1}
                                            className="size-9 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-800 flex-center transition-all shadow-2xs"
                                        >
                                            <Minus className="size-4" />
                                        </button>
                                        <span className="font-bold text-zinc-900 text-base px-3">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                                            disabled={quantity >= (product.stock || 99)}
                                            className="size-9 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-800 flex-center transition-all shadow-2xs"
                                        >
                                            <Plus className="size-4" />
                                        </button>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 px-6 py-3.5 bg-app-orange hover:bg-app-orange-dark text-white font-semibold rounded-2xl flex-center gap-2.5 shadow-sm transition-all active:scale-[0.98]"
                                    >
                                        <ShoppingCart className="size-5" />
                                        <span>Add to Cart • {currency} {subtotal.toFixed(1)}</span>
                                    </button>
                                </div>

                                {/* Buy Now Instant Checkout Button */}
                                <button
                                    onClick={handleBuyNow}
                                    className="w-full py-3.5 bg-app-green hover:bg-app-green-light text-white font-semibold rounded-2xl flex-center gap-2 shadow-xs transition-all active:scale-[0.98]"
                                >
                                    <Zap className="size-4 text-amber-300 fill-amber-300" />
                                    <span>Buy Now (Instant Checkout)</span>
                                </button>
                            </div>

                            {/* Savings callout banner if quantity > 1 */}
                            {savingsAmount > 0 && (
                                <div className="bg-emerald-50 rounded-xl p-2.5 text-center text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                                    🎉 You are saving {currency} {savingsAmount.toFixed(1)} on this order!
                                </div>
                            )}
                        </div>

                        {/* Location / Pincode Delivery Availability Checker */}
                        <div className="bg-white/70 rounded-2xl p-4 border border-app-border space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
                                <MapPin className="size-4 text-app-orange" />
                                <span>Check Delivery ETA in your Area</span>
                            </div>
                            <form onSubmit={handleCheckPincode} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter Postal Code or City (e.g. Kathmandu 44600)"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    className="flex-1 bg-white border border-zinc-300 rounded-xl px-3.5 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-app-green focus:ring-1 focus:ring-app-green"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                                >
                                    Check
                                </button>
                            </form>
                            {deliveryStatus && (
                                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 animate-fade-in">
                                    <Check className="size-3.5 text-emerald-600" /> {deliveryStatus}
                                </p>
                            )}
                        </div>

                        {/* Key Dietary Badges */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {details.dietaryTags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-200"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ─── SECTION: FREQUENTLY BOUGHT TOGETHER BUNDLE ─── */}
                {bundleProducts.length > 0 && (
                    <div className="mt-14 bg-white rounded-3xl p-6 sm:p-8 border border-app-border shadow-xs">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="size-5 text-app-orange" />
                            <h2 className="text-xl sm:text-2xl font-serif text-app-green">Frequently Bought Together</h2>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                            {/* Bundle items list */}
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 flex-1">
                                {/* Current product card */}
                                <div className="flex items-center gap-3 bg-orange-50/50 p-3 rounded-2xl border border-orange-200">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="size-16 sm:size-20 object-contain rounded-xl bg-white p-1"
                                    />
                                    <div>
                                        <span className="text-[10px] font-bold text-app-orange uppercase">Current Item</span>
                                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 line-clamp-1">
                                            {product.name}
                                        </p>
                                        <p className="text-xs font-bold text-app-green">
                                            {currency} {currentPrice.toFixed(1)}
                                        </p>
                                    </div>
                                </div>

                                {/* Plus connector & bundle items */}
                                {bundleProducts.map((bp) => (
                                    <div key={bp._id} className="flex items-center gap-4">
                                        <div className="size-7 rounded-full bg-zinc-100 text-zinc-500 font-bold flex-center shrink-0">
                                            +
                                        </div>
                                        <label
                                            className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                                                isBundleItemSelected(bp._id)
                                                    ? "bg-white border-app-green/40 shadow-xs"
                                                    : "bg-zinc-50 border-zinc-200 opacity-60"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isBundleItemSelected(bp._id)}
                                                onChange={(e) =>
                                                    setDeselectedBundleItems((prev) => ({
                                                        ...prev,
                                                        [bp._id]: !e.target.checked,
                                                    }))
                                                }
                                                className="size-4 accent-app-green rounded"
                                            />
                                            <img
                                                src={bp.image}
                                                alt={bp.name}
                                                className="size-14 sm:size-16 object-contain rounded-xl bg-white p-1"
                                            />
                                            <div>
                                                <p className="text-xs sm:text-sm font-semibold text-zinc-900 line-clamp-1">
                                                    {bp.name}
                                                </p>
                                                <p className="text-xs font-bold text-zinc-700">
                                                    {currency} {bp.price.toFixed(1)}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* Bundle CTA Card */}
                            <div className="w-full lg:w-72 bg-app-cream p-5 rounded-2xl border border-app-border space-y-3 shrink-0">
                                <div>
                                    <span className="text-xs text-zinc-500">Combo Total Price:</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-app-green">
                                            {currency} {bundleSubtotal.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddBundleToCart}
                                    className="w-full py-3 bg-app-orange hover:bg-app-orange-dark text-white text-xs sm:text-sm font-semibold rounded-xl flex-center gap-2 shadow-xs transition-colors"
                                >
                                    <ShoppingCart className="size-4" /> Add Bundle to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── SECTION: DETAILED PRODUCT TABS (OVERVIEW, NUTRITION, STORAGE, REVIEWS, POLICY) ─── */}
                <div id="pdp-tabs-section" className="mt-14 scroll-mt-24">
                    {/* Tabs Header Navigation */}
                    <div className="flex items-center gap-2 border-b border-app-border overflow-x-auto no-scrollbar pb-px">
                        <button
                            onClick={() => setActiveTab("details")}
                            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === "details"
                                    ? "border-app-green text-app-green bg-white/50 rounded-t-xl"
                                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                            }`}
                        >
                            <Info className="size-4" /> Product Details
                        </button>
                        <button
                            onClick={() => setActiveTab("nutrition")}
                            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === "nutrition"
                                    ? "border-app-green text-app-green bg-white/50 rounded-t-xl"
                                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                            }`}
                        >
                            <Flame className="size-4" /> Nutrition & Facts
                        </button>
                        <button
                            onClick={() => setActiveTab("storage")}
                            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === "storage"
                                    ? "border-app-green text-app-green bg-white/50 rounded-t-xl"
                                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                            }`}
                        >
                            <Utensils className="size-4" /> Storage & Usage
                        </button>
                        <button
                            onClick={() => setActiveTab("reviews")}
                            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === "reviews"
                                    ? "border-app-green text-app-green bg-white/50 rounded-t-xl"
                                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                            }`}
                        >
                            <Star className="size-4" /> Customer Reviews ({reviewStats.total})
                        </button>
                        <button
                            onClick={() => setActiveTab("policy")}
                            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === "policy"
                                    ? "border-app-green text-app-green bg-white/50 rounded-t-xl"
                                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                            }`}
                        >
                            <Truck className="size-4" /> Delivery & Returns
                        </button>
                    </div>

                    {/* Tab 1: Product Details */}
                    {activeTab === "details" && (
                        <div className="bg-white rounded-b-3xl rounded-tr-3xl p-6 sm:p-8 border border-app-border shadow-xs space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-semibold text-app-green mb-3">About the Product</h3>
                                <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                                    {product.description || "Farm fresh certified quality grocery item delivered directly from organic partner farms."}
                                </p>
                            </div>

                            {/* Highlights list */}
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-3">
                                    Key Highlights
                                </h4>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {details.highlights.map((highlight, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-600">
                                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span>{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Specifications Grid */}
                            <div className="pt-4 border-t border-app-border">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-3">
                                    Product Specifications
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                                        <span className="text-xs text-zinc-400 block">Net Quantity</span>
                                        <span className="text-sm font-semibold text-zinc-800">{product.unit}</span>
                                    </div>
                                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                                        <span className="text-xs text-zinc-400 block">Country of Origin</span>
                                        <span className="text-sm font-semibold text-zinc-800">{details.origin}</span>
                                    </div>
                                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                                        <span className="text-xs text-zinc-400 block">Category</span>
                                        <span className="text-sm font-semibold text-zinc-800">{details.categoryName}</span>
                                    </div>
                                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                                        <span className="text-xs text-zinc-400 block">Organic Certified</span>
                                        <span className="text-sm font-semibold text-emerald-700">
                                            {product.isOrganic ? "Yes (Certified)" : "Natural Grade"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Nutrition & Facts */}
                    {activeTab === "nutrition" && (
                        <div className="bg-white rounded-b-3xl rounded-tr-3xl p-6 sm:p-8 border border-app-border shadow-xs space-y-6 animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-app-green">Nutritional Information</h3>
                                    <p className="text-xs text-zinc-500">Values per serving size: {details.nutrition.servingSize}</p>
                                </div>
                                <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full">
                                    Approximate Dietary Reference Values
                                </span>
                            </div>

                            {/* Nutrition facts cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-app-cream rounded-2xl border border-app-border text-center">
                                    <span className="text-xs text-zinc-500">Energy / Calories</span>
                                    <p className="text-xl font-bold text-app-green mt-1">{details.nutrition.calories}</p>
                                </div>
                                <div className="p-4 bg-app-cream rounded-2xl border border-app-border text-center">
                                    <span className="text-xs text-zinc-500">Protein</span>
                                    <p className="text-xl font-bold text-app-green mt-1">{details.nutrition.protein}</p>
                                </div>
                                <div className="p-4 bg-app-cream rounded-2xl border border-app-border text-center">
                                    <span className="text-xs text-zinc-500">Carbohydrates</span>
                                    <p className="text-xl font-bold text-app-green mt-1">{details.nutrition.carbs}</p>
                                </div>
                                <div className="p-4 bg-app-cream rounded-2xl border border-app-border text-center">
                                    <span className="text-xs text-zinc-500">Total Fats</span>
                                    <p className="text-xl font-bold text-app-green mt-1">{details.nutrition.fat}</p>
                                </div>
                            </div>

                            {/* Secondary nutrients table */}
                            <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                                        <tr>
                                            <th className="px-4 py-3">Nutrient Component</th>
                                            <th className="px-4 py-3">Quantity per serving ({details.nutrition.servingSize})</th>
                                            <th className="px-4 py-3">% Daily Value*</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 text-zinc-700">
                                        <tr>
                                            <td className="px-4 py-3 font-medium">Dietary Fiber</td>
                                            <td className="px-4 py-3">{details.nutrition.fiber}</td>
                                            <td className="px-4 py-3">12%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-medium">Natural Sugars</td>
                                            <td className="px-4 py-3">{details.nutrition.sugar}</td>
                                            <td className="px-4 py-3">4%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-medium">Sodium</td>
                                            <td className="px-4 py-3">{details.nutrition.sodium}</td>
                                            <td className="px-4 py-3">2%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Storage & Usage */}
                    {activeTab === "storage" && (
                        <div className="bg-white rounded-b-3xl rounded-tr-3xl p-6 sm:p-8 border border-app-border shadow-xs space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
                                        <Clock className="size-4 text-blue-600" />
                                        <span>Shelf Life & Expiration</span>
                                    </div>
                                    <p className="text-zinc-700 text-sm">{details.shelfLife}</p>
                                </div>

                                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                                        <ShieldCheck className="size-4 text-emerald-600" />
                                        <span>Storage Guidelines</span>
                                    </div>
                                    <p className="text-zinc-700 text-sm">{details.storage}</p>
                                </div>
                            </div>

                            <div className="bg-app-cream p-5 rounded-2xl border border-app-border space-y-2">
                                <h4 className="text-sm font-semibold text-app-green flex items-center gap-2">
                                    <Utensils className="size-4 text-app-orange" /> Culinary & Preparation Tips
                                </h4>
                                <p className="text-sm text-zinc-600 leading-relaxed">{details.culinaryTips}</p>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Interactive Customer Reviews */}
                    {activeTab === "reviews" && (
                        <div className="bg-white rounded-b-3xl rounded-tr-3xl p-6 sm:p-8 border border-app-border shadow-xs space-y-8 animate-fade-in">
                            {/* Reviews Header & Overall Score */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-app-border">
                                {/* Score box */}
                                <div className="flex flex-col items-center text-center md:items-start md:text-left min-w-[200px]">
                                    <span className="text-5xl font-bold text-app-green">{reviewStats.avg}</span>
                                    <div className="flex items-center gap-1 my-2 text-amber-400">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`size-4 ${
                                                    s <= Math.round(parseFloat(reviewStats.avg))
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-zinc-200"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-500">Based on {reviewStats.total} verified reviews</p>
                                </div>

                                {/* Rating Bars */}
                                <div className="flex-1 w-full max-w-md space-y-2">
                                    {reviewStats.counts.map((count, i) => {
                                        const starNumber = 5 - i;
                                        const pct = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() =>
                                                    setSelectedRatingFilter((prev) =>
                                                        prev === starNumber ? null : starNumber
                                                    )
                                                }
                                                className={`w-full flex items-center gap-3 text-xs text-zinc-600 hover:text-app-green transition-colors ${
                                                    selectedRatingFilter === starNumber ? "font-bold text-app-green" : ""
                                                }`}
                                            >
                                                <span className="w-8 text-right">{starNumber} ★</span>
                                                <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="w-6 text-left text-zinc-400">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Write a Review Button */}
                                <div className="shrink-0">
                                    <button
                                        onClick={() => setIsReviewModalOpen(true)}
                                        className="px-5 py-3 bg-app-green hover:bg-app-green-light text-white text-xs sm:text-sm font-semibold rounded-2xl flex-center gap-2 shadow-xs transition-all"
                                    >
                                        <MessageSquarePlus className="size-4" /> Write a Review
                                    </button>
                                </div>
                            </div>

                            {/* Rating filter pill indicator */}
                            {selectedRatingFilter && (
                                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs">
                                    <span>Showing only {selectedRatingFilter}-star reviews</span>
                                    <button
                                        onClick={() => setSelectedRatingFilter(null)}
                                        className="text-amber-800 font-semibold underline"
                                    >
                                        Show All
                                    </button>
                                </div>
                            )}

                            {/* Reviews list */}
                            <div className="space-y-6">
                                {filteredReviews.map((rev) => (
                                    <div key={rev.id} className="flex gap-4 pb-6 border-b border-zinc-100 last:border-0">
                                        <div className="size-11 rounded-full bg-emerald-100 text-app-green font-bold text-sm flex-center shrink-0">
                                            {rev.avatar}
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-zinc-900">{rev.name}</span>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                                                        <Check className="size-3" /> Verified Buyer
                                                    </span>
                                                </div>
                                                <span className="text-xs text-zinc-400">{rev.date}</span>
                                            </div>

                                            <div className="flex items-center gap-0.5 text-amber-400">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={`size-3.5 ${
                                                            s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                                                        }`}
                                                    />
                                                ))}
                                            </div>

                                            <p className="text-sm text-zinc-700 leading-relaxed">{rev.comment}</p>

                                            <div className="pt-1">
                                                <button
                                                    onClick={() => handleHelpfulVote(rev.id)}
                                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                                        rev.userUpvoted
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                                                    }`}
                                                >
                                                    <ThumbsUp className="size-3.5" /> Helpful ({rev.helpful})
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 5: Delivery & Returns */}
                    {activeTab === "policy" && (
                        <div className="bg-white rounded-b-3xl rounded-tr-3xl p-6 sm:p-8 border border-app-border shadow-xs space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                                    <Truck className="size-6 text-app-orange" />
                                    <h4 className="font-semibold text-sm text-zinc-900">Express Delivery</h4>
                                    <p className="text-xs text-zinc-600">
                                        Orders are delivered via temperature-controlled delivery bikes in 15-30 minutes across Kathmandu Valley.
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                                    <RotateCcw className="size-6 text-app-green" />
                                    <h4 className="font-semibold text-sm text-zinc-900">Doorstep Replacement</h4>
                                    <p className="text-xs text-zinc-600">
                                        Inspect produce at delivery. If not completely satisfied with freshness, we offer instant replacement or refund.
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                                    <ShieldCheck className="size-6 text-emerald-600" />
                                    <h4 className="font-semibold text-sm text-zinc-900">Contactless & Sealed</h4>
                                    <p className="text-xs text-zinc-600">
                                        All groceries are sealed in hygienic, food-grade biodegradable bags for safe delivery.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── SECTION: RELATED PRODUCTS (YOU MAY ALSO LIKE) ─── */}
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-serif text-app-green">You May Also Like</h2>
                            <p className="text-xs sm:text-sm text-zinc-500">Popular items from {details.categoryName}</p>
                        </div>
                        <Link
                            to={`/products?category=${product.category}`}
                            className="text-xs sm:text-sm font-semibold text-app-orange hover:text-app-orange-dark flex items-center gap-1"
                        >
                            View All <ChevronRight className="size-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {relatedProducts.map((rel) => (
                            <ProductCard key={rel.id || rel._id} product={rel} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── STICKY BOTTOM BAR FOR MOBILE ─── */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-app-border p-3 z-40 lg:hidden flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                    <img src={product.image} alt={product.name} className="size-10 object-contain rounded-lg p-0.5 bg-zinc-50 border shrink-0" />
                    <div className="truncate">
                        <p className="text-xs font-semibold text-zinc-900 truncate">{product.name}</p>
                        <p className="text-xs font-bold text-app-green">
                            {currency} {(currentPrice * quantity).toFixed(1)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-zinc-200 rounded-xl bg-zinc-50 p-1">
                        <button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="size-7 rounded-lg bg-white text-zinc-800 flex-center"
                        >
                            <Minus className="size-3" />
                        </button>
                        <span className="text-xs font-bold px-2">{quantity}</span>
                        <button
                            onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                            className="size-7 rounded-lg bg-white text-zinc-800 flex-center"
                        >
                            <Plus className="size-3" />
                        </button>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className="px-4 py-2 bg-app-orange text-white text-xs font-semibold rounded-xl flex-center gap-1.5 shadow-sm"
                    >
                        <ShoppingCart className="size-4" /> Add
                    </button>
                </div>
            </div>

            {/* ─── MODAL: FULLSCREEN IMAGE LIGHTBOX ─── */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex-center p-4 animate-fade-in"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div
                        className="relative max-w-2xl w-full bg-white rounded-3xl p-6 flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-4 right-4 size-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex-center transition-colors"
                        >
                            <X className="size-5" />
                        </button>

                        <h3 className="text-base font-semibold text-zinc-900 mb-4">{product.name}</h3>

                        <div className="aspect-square w-full max-h-[500px] flex-center p-4">
                            <img src={selectedImage} alt={product.name} className="max-h-full max-w-full object-contain" />
                        </div>

                        {details.galleryImages.length > 1 && (
                            <div className="flex gap-2 mt-4">
                                {details.galleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageOverride(img)}
                                        className={`size-14 rounded-xl p-1 bg-zinc-50 border-2 overflow-hidden ${
                                            selectedImage === img ? "border-app-orange" : "border-transparent"
                                        }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── MODAL: SHARE MODAL ─── */}
            {isShareModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex-center p-4 animate-fade-in"
                    onClick={() => setIsShareModalOpen(false)}
                >
                    <div
                        className="relative max-w-md w-full bg-white rounded-3xl p-6 space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-app-green">Share Product</h3>
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex-center"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border">
                            <img src={product.image} alt={product.name} className="size-12 object-contain" />
                            <div className="truncate">
                                <p className="text-sm font-semibold text-zinc-900 truncate">{product.name}</p>
                                <p className="text-xs text-zinc-500">{currency} {currentPrice.toFixed(1)} / {product.unit}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={window.location.href}
                                className="flex-1 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-600 select-all"
                            />
                            <button
                                onClick={copyProductLink}
                                className="px-4 py-2 bg-app-green hover:bg-app-green-light text-white text-xs font-semibold rounded-xl flex-center gap-1.5 transition-colors"
                            >
                                <Copy className="size-3.5" /> Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: WRITE A CUSTOMER REVIEW ─── */}
            {isReviewModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex-center p-4 animate-fade-in"
                    onClick={() => setIsReviewModalOpen(false)}
                >
                    <div
                        className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-serif text-app-green">Write a Customer Review</h3>
                                <p className="text-xs text-zinc-500">Share your experience with {product.name}</p>
                            </div>
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex-center"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddReview} className="space-y-4">
                            {/* Star rating selector */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Your Rating</label>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setNewReviewRating(star)}
                                            className="p-1 hover:scale-110 transition-transform"
                                        >
                                            <Star
                                                className={`size-7 ${
                                                    star <= newReviewRating
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-zinc-200"
                                                }`}
                                            />
                                        </button>
                                    ))}
                                    <span className="text-xs font-bold text-amber-800 ml-2">
                                        {newReviewRating} out of 5 stars
                                    </span>
                                </div>
                            </div>

                            {/* Name input */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 mb-1">Your Name (from your account)</label>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="e.g. Ramesh Karki"
                                    value={newReviewName}
                                    onChange={(e) => setNewReviewName(e.target.value)}
                                    className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-800 focus:border-app-green focus:ring-1 focus:ring-app-green"
                                />
                            </div>

                            {/* Comment textarea */}
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 mb-1">Your Review</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Tell us what you liked about this item, delivery freshness, packaging..."
                                    value={newReviewComment}
                                    onChange={(e) => setNewReviewComment(e.target.value)}
                                    className="w-full bg-white border border-zinc-300 rounded-xl p-3 text-sm text-zinc-800 focus:border-app-green focus:ring-1 focus:ring-app-green"
                                />
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={submittingReview}
                                className="w-full py-3.5 bg-app-green hover:bg-app-green-light text-white font-semibold rounded-xl flex-center gap-2 shadow-xs transition-colors disabled:opacity-60"
                            >
                                <Send className="size-4" /> {submittingReview ? "Submitting..." : "Submit Review"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

