import { useState } from "react";
import authService, { api } from "../services/authServices";
import { Link } from "react-router-dom";
import {
    Store,
    TrendingUp,
    Truck,
    ShieldCheck,
    Coins,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    ChevronDown,
    Building2,
    User,
    Smartphone,
    PackageCheck,
    Users,
    Calculator,
    MessageCircle,
    Star,
} from "lucide-react";
import toast from "react-hot-toast";
import SellerDocuments, { emptyDocs, emptyExtra, buildApplicationData, type SellerDocs, type SellerExtra } from "../components/Seller/SellerDocuments";

const businessCategories = [
    "Kirana & General Grocery Store",
    "Fresh Fruits & Vegetables Vendor",
    "Organic Farm & Produce Producer",  
    "Dairy, Milk & Paneer Parlour",
    "Bakery, Pastry & Sweets Shop",
    "Fresh Meat & Poultry Counter",
    "Packaged Snacks & Beverages Wholesaler",
    "Personal Care & Household Essentials",
];

const faqs = [
    {
        q: "What does Pasalmandu do for local grocery shop owners?",
        a: "Pasalmandu connects your physical neighborhood store with thousands of local households in your delivery radius. We digitize your product stock, market your store on the app, provide delivery riders within 15 minutes of an order, and deposit your sales earnings directly into your bank or eSewa account.",
    },
    {
        q: "Do I need to hire delivery drivers or delivery staff?",
        a: "No! Pasalmandu manages 100% of the delivery logistics. Whenever a customer places an order from your shop, our nearest rider receives the pickup notification, arrives at your store counter, collects the packed bag, and completes the 15-30 minute doorstep delivery.",
    },
    {
        q: "What is the onboarding fee and commission structure?",
        a: "Signing up is 100% free with ZERO upfront charges. For all new partner stores, we offer 0% commission for the first 30 days. After that, we charge a nominal, industry-low commission per completed order so you keep the vast majority of your profits.",
    },
    {
        q: "How do I upload and manage my product catalog & prices?",
        a: "You do not need technical expertise. Our dedicated catalog onboarding team will help you upload your inventory with professional photos and barcode barcodes in under 24 hours. You can also adjust prices or toggle out-of-stock items in 1 click from your Merchant mobile app.",
    },
    {
        q: "When and how do I receive my payouts?",
        a: "Payouts are automated weekly or on-demand directly to your registered bank account, eSewa, or Khalti wallet with transparent, itemized invoices and zero hidden deductions.",
    },
    {
        q: "What happens if a customer returns an item or items get damaged in transit?",
        a: "Pasalmandu covers transit damages through our Merchant Protection Guarantee. If an item is damaged during delivery, you receive full reimbursement without penalty.",
    },
];

const testimonials = [
    {
        store: "Baneshwor Fresh Mart",
        owner: "Ramesh Shrestha",
        location: "Old Baneshwor, Kathmandu",
        rating: 5,
        growth: "+140% Monthly Sales",
        quote: "Before Pasalmandu, rainy days meant zero walk-in customers. Now, rainy days are our highest earning days because orders keep buzzing on the merchant tablet and riders pick them up in minutes.",
    },
    {
        store: "Himalayan Organic Valley",
        owner: "Sarita Adhikari",
        location: "Bhaktapur",
        rating: 5,
        growth: "45+ Daily Orders",
        quote: "Our organic greens and dairy reach households in Kathmandu within 25 minutes of harvesting. The 0% initial commission and automated weekly payouts made joining a no-brainer.",
    },
    {
        store: "Newa Meat & Poultry Mart",
        owner: "Prakash Maharjan",
        location: "Patan, Lalitpur",
        rating: 5,
        growth: "Rs. 95,000+ Extra Profit/Mo",
        quote: "The easiest system I've used. I just keep the meat hygienic and packed when the order arrives. The rider scans the QR code and takes care of the customer delivery.",
    },
];

const BecomeSeller = () => {
        // Already a seller: no need to apply again
    const currentUser = authService.getCurrentUser();
    if (currentUser?.isVendor) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
                <p className="text-2xl font-bold text-zinc-900">You're already a Pasalmandu seller</p>
                <p className="text-sm text-zinc-500">Manage your products and orders from the Seller Panel.</p>
                <Link to="/vendor" className="px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl">Open Seller Panel</Link>
            </div>
        );
    }
    // Interactive Profit Calculator State
    const [dailyOrders, setDailyOrders] = useState<number>(30);
    const [avgOrderValue, setAvgOrderValue] = useState<number>(850);
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs.";

    // Estimated monthly gross & net revenue
    const estimatedMonthlySales = dailyOrders * avgOrderValue * 30;
    const estimatedExtraProfit = Math.round(estimatedMonthlySales * 0.18); // ~18% typical grocery margin

    // Form State
    const [form, setForm] = useState({
        storeName: "",
        ownerName: "",
        phone: "",
        email: "",
        category: businessCategories[0],
        city: "Kathmandu",
        address: "",
        hasPanVat: "yes",
        dailyCapacity: "20-50 orders",
        agreedToTerms: true,
    });

    const [docs, setDocs] = useState<SellerDocs>(emptyDocs);          // uploaded files
    const [extra, setExtra] = useState<SellerExtra>(emptyExtra);    // ID, PAN, bank details

    const [loading, setLoading] = useState(false);
    const [submittedData, setSubmittedData] = useState<{
        appId: string;
        storeName: string;
        ownerName: string;
        phone: string;
    } | null>(null);

    const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setForm((prev) => ({ ...prev, [name]: checked }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = buildApplicationData(form, extra, docs);
        if (!data) { toast.error(error ?? "Please check the form"); return; }

        setLoading(true);
        try {
            // Saves the application + files (admin sees it under Admin -> Vendors)
            const app = (await api.post("/api/vendors/apply", data, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 120000,        // uploads can take a while
            })) as unknown as { appId: string; storeName: string; ownerName: string; phone: string };
            setSubmittedData({ appId: app.appId, storeName: app.storeName, ownerName: app.ownerName, phone: app.phone });
            setDocs(emptyDocs);
            toast.success("Application Submitted Successfully!", {
                icon: "🎉",
                style: { borderRadius: "12px", background: "#1B3022", color: "#fff" },
            });
            window.scrollTo({ top: document.getElementById("application-section")?.offsetTop || 0, behavior: "smooth" });
        } catch (error: any) {
            const res = error?.response;
            const first = res?.data?.errors ? (Object.values(res.data.errors as Record<string, string[]>).flat()[0] as string) : undefined;
            toast.error(
                !res ? "Cannot reach the server. Is the API running?"
                    : res.status === 413 ? "The files are too large. Use files under 5 MB each."
                    : res.data?.message || first || "Could not submit the application"
            );
        } finally {
            setLoading(false);
        }
    };

    const scrollToForm = () => {
        const el = document.getElementById("application-section");
        el?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-app-cream pb-24">
            {/* ── 1. HERO SECTION ────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-linear-to-br from-[#1B3022] via-[#223f2d] to-emerald-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
                {/* Background glow orbs */}
                <div className="absolute -top-24 -left-24 size-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 size-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        
                        {/* Left Hero Content */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs sm:text-sm font-semibold border border-amber-400/30 shadow-sm">
                                <Sparkles className="size-4 text-amber-400" />
                                <span>Pasalmandu Merchant Network • Kathmandu Valley</span>
                            </div>

                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif leading-tight">
                                Turn your local shop into an <span className="text-amber-400 underline decoration-amber-400/50 decoration-wavy">Online Powerhouse</span>
                            </h1>

                            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Connect your grocery store, farm, or butchery to 50,000+ local customers. We handle catalog setup, customer marketing, and 15-30 min doorstep delivery so you can focus on stocking great products.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                <button
                                    onClick={scrollToForm}
                                    className="w-full sm:w-auto px-8 py-4 bg-app-orange hover:bg-app-orange-dark text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-600/30 transition-all hover:scale-105 active:scale-95 text-base"
                                >
                                    <Store className="size-5" />
                                    <span>Register Your Shop</span>
                                    <ArrowRight className="size-5" />
                                </button>

                                <a
                                    href="#calculator-section"
                                    className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 border border-white/20 transition-all"
                                >
                                    <Calculator className="size-5 text-amber-400" />
                                    <span>Calculate Earnings</span>
                                </a>
                            </div>

                            {/* Trust badges row */}
                            <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center lg:text-left">
                                <div>
                                    <p className="text-2xl font-bold text-amber-400 font-sans">0% Fee</p>
                                    <p className="text-xs text-white/70">First 30 days free</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-400 font-sans">15-30 Min</p>
                                    <p className="text-xs text-white/70">Express delivery</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-400 font-sans">500+</p>
                                    <p className="text-xs text-white/70">Active store partners</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-400 font-sans">Weekly</p>
                                    <p className="text-xs text-white/70">Direct bank payouts</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Hero Visual Card */}
                        <div className="lg:col-span-5">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-2xl bg-amber-400 text-green-950 flex items-center justify-center font-bold text-xl shadow-md">
                                            🏪
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-base">Merchant Live Dashboard</h4>
                                            <p className="text-xs text-white/70">Sample Store Overview</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                                        Open for Orders
                                    </span>
                                </div>

                                {/* Mini Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                                        <p className="text-xs text-white/70">Today's Orders</p>
                                        <p className="text-2xl font-bold mt-1 text-amber-300">42 Orders</p>
                                        <p className="text-[11px] text-emerald-300 flex items-center gap-1 mt-1">
                                            <TrendingUp className="size-3" /> +28% vs yesterday
                                        </p>
                                    </div>
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                                        <p className="text-xs text-white/70">Today's Revenue</p>
                                        <p className="text-2xl font-bold mt-1 text-amber-300">Rs. 38,450</p>
                                        <p className="text-[11px] text-white/70 mt-1">Auto-payout on Sunday</p>
                                    </div>
                                </div>

                                {/* Simulated Order Alert */}
                                <div className="bg-emerald-950/80 rounded-2xl p-4 border border-emerald-500/40 space-y-2 animate-pulse-soft">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-emerald-300 flex items-center gap-1">
                                            <PackageCheck className="size-4" /> Incoming Express Order #4829
                                        </span>
                                        <span className="text-white/60">Just now</span>
                                    </div>
                                    <p className="text-xs text-white/90">
                                        5 Items • Fresh Veggies & Dairy (Rs. 1,420)
                                    </p>
                                    <div className="text-[11px] text-white/70 flex items-center justify-between pt-1 border-t border-white/10">
                                        <span>Rider arrives in: <strong className="text-amber-400">4 mins</strong></span>
                                        <span className="text-emerald-300 font-semibold">Ready to Pack</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 2. WHY SHOP OWNERS LOVE PASALMANDU ────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-app-orange">
                        Designed for Shop Owners & Local Vendors
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-serif text-app-green">
                        Everything you need to grow, with zero operational headaches
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-600">
                        Traditional online selling is hard. Pasalmandu takes away the delivery, marketing, and tech complications so running your digital shop feels as easy as handing over groceries at your counter.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    
                    {/* Benefit 1 */}
                    <div className="bg-white rounded-3xl p-7 border border-app-border shadow-xs hover:shadow-md transition-all group">
                        <div className="size-14 rounded-2xl bg-orange-50 text-app-orange flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <Truck className="size-7" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">We Handle 100% of Delivery</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            No need to hire delivery boys, maintain bikes, or coordinate phone calls. Our verified courier riders pick up from your store counter and deliver to the customer in 15 to 30 minutes.
                        </p>
                    </div>

                    {/* Benefit 2 */}
                    <div className="bg-white rounded-3xl p-7 border border-app-border shadow-xs hover:shadow-md transition-all group">
                        <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <Smartphone className="size-7" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Simple 1-Tap Merchant App</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            Receive notifications on your phone or counter tablet. Accept the order, pack the bag, and hand it to the rider. Change prices or stock status with a single tap.
                        </p>
                    </div>

                    {/* Benefit 3 */}
                    <div className="bg-white rounded-3xl p-7 border border-app-border shadow-xs hover:shadow-md transition-all group">
                        <div className="size-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <Sparkles className="size-7" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Free Inventory & Catalog Setup</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            Don't worry about typing in hundreds of product names or taking photos. Our onboarding team visits your store or sets up your digital shelf in 24 hours for free.
                        </p>
                    </div>

                    {/* Benefit 4 */}
                    <div className="bg-white rounded-3xl p-7 border border-app-border shadow-xs hover:shadow-md transition-all group">
                        <div className="size-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <Coins className="size-7" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Automated Direct Payouts</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            Get paid every week or on-demand directly into your Bank account, eSewa, or Khalti with clear, transparent GST/VAT reports and zero hidden deductions.
                        </p>
                    </div>

                    {/* Benefit 5 */}
                    <div className="bg-white rounded-3xl p-7 border border-app-border shadow-xs hover:shadow-md transition-all group">
                        <div className="size-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <Users className="size-7" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">50,000+ Ready Buyers</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            Reach busy families, working professionals, and hostels within a 5km radius who prefer online grocery orders instead of walking to physical markets.
                        </p>
                    </div>

                    {/* Benefit 6 */}
                    <div className="bg-white rounded-3xl p-7 border border-app-border shadow-xs hover:shadow-md transition-all group">
                        <div className="size-14 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="size-7" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">100% Merchant Damage Protection</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            If any item gets dropped or damaged during delivery transit by our rider, you receive 100% reimbursement. Your stock and margins are always safe.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── 3. HOW IT WORKS (3 SIMPLE STEPS) ──────────────────────── */}
            <section className="bg-white py-16 sm:py-20 border-y border-app-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-app-orange">
                            Simple 3-Step Process
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-serif text-app-green">
                            How to start selling on Pasalmandu
                        </h2>
                        <p className="text-sm text-zinc-500">Go live and receive your first order in under 24 hours</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Step 1 */}
                        <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-zinc-200/80 relative space-y-4">
                            <div className="size-12 rounded-2xl bg-app-green text-white font-bold text-lg flex items-center justify-center shadow-md">
                                01
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">Submit Shop Details</h3>
                            <p className="text-sm text-zinc-600 leading-relaxed">
                                Fill out our quick 2-minute registration form below with your shop name, contact number, and category.
                            </p>
                            <div className="pt-2 text-xs font-semibold text-app-green flex items-center gap-1.5">
                                <CheckCircle2 className="size-4 text-emerald-600" /> Free 30-day trial activated instantly
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-zinc-200/80 relative space-y-4">
                            <div className="size-12 rounded-2xl bg-app-orange text-white font-bold text-lg flex items-center justify-center shadow-md">
                                02
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">Free Catalog Setup</h3>
                            <p className="text-sm text-zinc-600 leading-relaxed">
                                Our vendor partner manager contacts you to assist with product list, pricing, and packaging kit delivery to your store.
                            </p>
                            <div className="pt-2 text-xs font-semibold text-app-green flex items-center gap-1.5">
                                <CheckCircle2 className="size-4 text-emerald-600" /> We handle digital barcodes & photos
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-zinc-200/80 relative space-y-4">
                            <div className="size-12 rounded-2xl bg-emerald-800 text-white font-bold text-lg flex items-center justify-center shadow-md">
                                03
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">Receive Orders & Grow</h3>
                            <p className="text-sm text-zinc-600 leading-relaxed">
                                Orders appear on your device. Simply pack them, hand them over to our 15-min delivery rider, and receive automated payouts!
                            </p>
                            <div className="pt-2 text-xs font-semibold text-app-green flex items-center gap-1.5">
                                <CheckCircle2 className="size-4 text-emerald-600" /> Direct bank & wallet deposits
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 4. INTERACTIVE PROFIT CALCULATOR ────────────────────────── */}
            <section id="calculator-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <div className="bg-gradient-to-br from-[#1B3022] to-emerald-900 text-white rounded-3xl p-6 sm:p-12 shadow-xl border border-emerald-700/40">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        
                        {/* Calculator Controls */}
                        <div className="lg:col-span-6 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
                                <Calculator className="size-4 text-amber-400" /> Interactive Earnings Estimator
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-serif">
                                Estimate your additional store revenue with Pasalmandu
                            </h2>
                            <p className="text-sm text-white/80 leading-relaxed">
                                See how much extra revenue and profit your shop can generate by fulfilling online neighborhood grocery deliveries.
                            </p>

                            {/* Slider 1: Daily Orders */}
                            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-white/90">Estimated Daily Online Orders:</span>
                                    <span className="font-bold text-amber-400 text-lg">{dailyOrders} Orders / day</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    step="5"
                                    value={dailyOrders}
                                    onChange={(e) => setDailyOrders(Number(e.target.value))}
                                    className="w-full accent-amber-400 cursor-pointer"
                                />
                                <div className="flex justify-between text-[11px] text-white/60">
                                    <span>5 orders (Part-time)</span>
                                    <span>50 orders</span>
                                    <span>100+ orders (High volume)</span>
                                </div>
                            </div>

                            {/* Slider 2: Average Order Value */}
                            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-white/90">Average Basket / Order Value:</span>
                                    <span className="font-bold text-amber-400 text-lg">{currency} {avgOrderValue.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range"
                                    min="300"
                                    max="3000"
                                    step="50"
                                    value={avgOrderValue}
                                    onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                                    className="w-full accent-amber-400 cursor-pointer"
                                />
                                <div className="flex justify-between text-[11px] text-white/60">
                                    <span>{currency} 300 (Small snacks)</span>
                                    <span>{currency} 1,500</span>
                                    <span>{currency} 3,000 (Weekly pantry)</span>
                                </div>
                            </div>
                        </div>

                        {/* Calculated Output Card */}
                        <div className="lg:col-span-6">
                            <div className="bg-white text-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                                <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-3">
                                    Your Estimated Monthly Potential
                                </h3>

                                <div className="space-y-4">
                                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                                            Estimated Additional Monthly Sales
                                        </p>
                                        <p className="text-3xl sm:text-4xl font-bold text-app-green mt-1">
                                            {currency} {estimatedMonthlySales.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Based on {dailyOrders * 30} total monthly customer deliveries
                                        </p>
                                    </div>

                                    <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-app-orange-dark">
                                            Estimated Extra Monthly Net Profit
                                        </p>
                                        <p className="text-2xl sm:text-3xl font-bold text-app-orange mt-1">
                                            {currency} {estimatedExtraProfit.toLocaleString()} / month
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Calculated at average 18% grocery margin with 0% introductory fee
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={scrollToForm}
                                    className="w-full py-4 bg-app-orange hover:bg-app-orange-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                                >
                                    <span>Start Earning Today</span>
                                    <ArrowRight className="size-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 5. TESTIMONIALS & STORE STORIES ────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-app-orange">
                        Merchant Success Stories
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-serif text-app-green">
                        Hear from local shop owners growing with us
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {testimonials.map((t, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-6 sm:p-7 border border-app-border shadow-xs flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <Star key={i} className="size-4 fill-amber-400" />
                                    ))}
                                </div>
                                <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                                    {t.growth}
                                </span>
                                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed italic">
                                    &ldquo;{t.quote}&rdquo;
                                </p>
                            </div>

                            <div className="border-t border-zinc-100 pt-3">
                                <p className="font-bold text-sm text-zinc-900">{t.store}</p>
                                <p className="text-xs text-zinc-500">{t.owner} • {t.location}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 6. SELLER REGISTRATION APPLICATION FORM ───────────────── */}
            <section id="application-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="bg-white rounded-3xl border border-app-border shadow-xl overflow-hidden">
                    
                    {/* Form Top Header */}
                    <div className="bg-gradient-to-r from-[#1B3022] via-[#244230] to-emerald-900 text-white p-6 sm:p-10 text-center relative overflow-hidden">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3">
                            <Store className="size-3.5" /> Fast 2-Minute Onboarding
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-serif">Apply to Become a Pasalmandu Partner Store</h2>
                        <p className="text-xs sm:text-sm text-white/70 max-w-lg mx-auto mt-2">
                            Fill in your shop details below. Our partner onboarding specialist will reach out within 24 hours to finalize your catalog and activate your merchant account.
                        </p>
                    </div>

                    {/* Form Body */}
                    <div className="p-6 sm:p-10">
                        {!submittedData ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                
                                {/* Section A: Shop Details */}
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-app-green flex items-center gap-2 mb-4">
                                        <Building2 className="size-4 text-app-orange" />
                                        <span>1. Store & Business Information</span>
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Store / Shop Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="storeName"
                                                required
                                                value={form.storeName}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Kathmandu Valley Grocery & Organic"
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Primary Business Category *
                                            </label>
                                            <select
                                                name="category"
                                                value={form.category}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            >
                                                {businessCategories.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                City / Region *
                                            </label>
                                            <select
                                                name="city"
                                                value={form.city}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            >
                                                <option value="Kathmandu">Kathmandu (All Wards)</option>
                                                <option value="Lalitpur">Lalitpur / Patan</option>
                                                <option value="Bhaktapur">Bhaktapur / Madhyapur</option>
                                                <option value="Kirtipur">Kirtipur & Outskirts</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Shop Street Address & Landmark *
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                required
                                                value={form.address}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Near New Baneshwor Chowk, Ward 10"
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section B: Owner Contact Details */}
                                <div className="pt-4 border-t border-zinc-100">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-app-green flex items-center gap-2 mb-4">
                                        <User className="size-4 text-app-orange" />
                                        <span>2. Owner / Contact Person</span>
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Owner / Manager Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="ownerName"
                                                required
                                                value={form.ownerName}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Ramesh Shrestha"
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Mobile / WhatsApp Number *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                value={form.phone}
                                                onChange={handleInputChange}
                                                placeholder="98XXXXXXXX"
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={form.email}
                                                onChange={handleInputChange}
                                                placeholder="store@gmail.com"
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section C: Operations & Readiness */}
                                <div className="pt-4 border-t border-zinc-100">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-app-green flex items-center gap-2 mb-4">
                                        <PackageCheck className="size-4 text-app-orange" />
                                        <span>3. Operations & Capacity</span>
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Do you have PAN / VAT registration?
                                            </label>
                                            <select
                                                name="hasPanVat"
                                                value={form.hasPanVat}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            >
                                                <option value="yes">Yes, Registered Business (PAN/VAT available)</option>
                                                <option value="individual">Individual Local Farmer / Small Vendor</option>
                                                <option value="in_process">In process of registration</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Estimated Daily Order Handling Capacity
                                            </label>
                                            <select
                                                name="dailyCapacity"
                                                value={form.dailyCapacity}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none"
                                            >
                                                <option value="10-25 orders">10 - 25 Orders / day</option>
                                                <option value="25-50 orders">25 - 50 Orders / day</option>
                                                <option value="50-100 orders">50 - 100 Orders / day</option>
                                                <option value="100+ orders">100+ Orders / day (Supermarket scale)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Sections 4 & 5: Identity, documents, bank */}
                                <SellerDocuments hasPanVat={form.hasPanVat} docs={docs} setDocs={setDocs} extra={extra} setExtra={setExtra} />

                                {/* Terms & Submit */}
                                <div className="pt-4 border-t border-zinc-100 space-y-4">
                                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-600">
                                        <input
                                            type="checkbox"
                                            name="agreedToTerms"
                                            checked={form.agreedToTerms}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-0.5 rounded text-app-orange focus:ring-app-orange cursor-pointer"
                                        />
                                        <span>
                                            I agree to Pasalmandu Merchant Terms of Service and acknowledge that I will receive free onboarding, 0% commission for 30 days, and dedicated courier support.
                                        </span>
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-app-orange hover:bg-app-orange-dark text-white font-bold rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Submitting Application...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span>Submit Seller Application</span>
                                                <ArrowRight className="size-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* Submission Confirmation Card */
                            <div className="text-center py-10 space-y-6 animate-fade-in">
                                <div className="size-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle2 className="size-12" />
                                </div>

                                <div className="space-y-2">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-900 font-mono text-xs font-bold rounded-full">
                                        Application ID: {submittedData.appId}
                                    </span>
                                    <h3 className="text-2xl font-bold text-zinc-900">
                                        Congratulations, {submittedData.ownerName}!
                                    </h3>
                                    <p className="text-sm text-zinc-600 max-w-md mx-auto">
                                        We have received the partnership application for <strong className="text-app-green">{submittedData.storeName}</strong>.
                                    </p>
                                </div>

                                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-left max-w-lg mx-auto space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">What happens next?</p>
                                    <ul className="text-xs text-zinc-600 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-app-orange">1.</span>
                                            <span>Our Merchant Account Specialist will call you on <strong className="text-zinc-800">{submittedData.phone}</strong> within 24 hours.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-app-orange">2.</span>
                                            <span>We will deliver your free merchant starter packaging kit & tablet scanner to your shop address.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-app-orange">3.</span>
                                            <span>Your store will go live to 50,000+ local grocery buyers with 0% initial fees!</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Link
                                        to="/"
                                        className="w-full sm:w-auto px-6 py-3 bg-app-green hover:bg-emerald-950 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors"
                                    >
                                        Back to Home
                                    </Link>
                                    <button
                                        onClick={() => setSubmittedData(null)}
                                        className="w-full sm:w-auto px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
                                    >
                                        Submit Another Store
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── 7. FAQ ACCORDION ────────────────────────────────────────── */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-app-orange">
                        Frequently Asked Questions
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-serif text-app-green">
                        Got questions? We're here to help
                    </h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => {
                        const isExpanded = expandedFaq === i;
                        return (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-app-border overflow-hidden transition-all shadow-xs"
                            >
                                <button
                                    onClick={() => setExpandedFaq(isExpanded ? null : i)}
                                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-zinc-900 hover:text-app-green transition-colors text-sm sm:text-base"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        className={`size-5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                                            isExpanded ? "rotate-180 text-app-orange" : ""
                                        }`}
                                    />
                                </button>
                                {isExpanded && (
                                    <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── 8. DIRECT SUPPORT BANNER ───────────────────────────────── */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <MessageCircle className="size-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-900 text-base">Prefer talking to a real person?</h4>
                            <p className="text-xs text-zinc-600 mt-0.5">
                                Call or WhatsApp our Vendor Support Desk at <strong className="text-app-green font-mono">+977 9801234567</strong>
                            </p>
                        </div>
                    </div>
                    <a
                        href="tel:+9779801234567"
                        className="px-5 py-2.5 bg-app-green text-white text-xs font-semibold rounded-xl hover:bg-emerald-950 transition-colors whitespace-nowrap shadow-xs"
                    >
                        Call Vendor Support
                    </a>
                </div>
            </section>
        </div>
    );
};

export default BecomeSeller;