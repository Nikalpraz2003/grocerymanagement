import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, Clock, MapPin, ShoppingBag, RefreshCw } from "lucide-react";
import { shopApi, shopError, statusStyle, orderDate, type ShopOrder } from "../services/shopApi";

const FILTERS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "Delivered", label: "Delivered" },
    { key: "Cancelled", label: "Cancelled" },
] as const;

const MyOrders = () => {
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs.";
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setOrders(await shopApi.myOrders());
        } catch (e) {
            setError(shopError(e, "Could not load your orders"));
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { void load(); }, []);

    const shown = useMemo(() => orders.filter((o) =>
        filter === "all" ? true
            : filter === "active" ? o.status !== "Delivered" && o.status !== "Cancelled"
            : o.status === filter
    ), [orders, filter]);

    return (
        <div className="min-h-screen bg-app-cream pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-900 flex items-center gap-2.5">
                            <Package className="size-7 text-app-orange" /> My Orders
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">Track and manage your grocery deliveries.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => void load()}
                            className="p-2 rounded-xl bg-white border border-app-border text-zinc-600 hover:text-app-green"
                            title="Refresh"
                        >
                            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <Link
                            to="/products"
                            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-app-green hover:bg-app-green-light text-white rounded-xl transition-colors"
                        >
                            <ShoppingBag className="size-3.5" /> Order More
                        </Link>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                                filter === f.key ? "bg-app-green text-white border-app-green" : "bg-white text-zinc-600 border-app-border hover:border-app-green"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
                        <span>{error}</span>
                        <button onClick={() => void load()} className="text-xs font-semibold underline">Try again</button>
                    </div>
                )}

                {loading && orders.length === 0 && (
                    <div className="space-y-4">
                        {[1, 2].map((i) => <div key={i} className="h-40 bg-white rounded-3xl border border-app-border animate-pulse" />)}
                    </div>
                )}

                {!loading && !error && shown.length === 0 && (
                    <div className="bg-white rounded-3xl border border-app-border p-10 text-center">
                        <Package className="size-12 text-zinc-300 mx-auto mb-3" />
                        <p className="font-semibold text-zinc-800">
                            {orders.length === 0 ? "You haven't placed any orders yet" : "No orders in this list"}
                        </p>
                        <Link to="/products" className="inline-flex mt-4 px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl">
                            Start shopping
                        </Link>
                    </div>
                )}

                {/* Orders List */}
                <div className="space-y-4">
                    {shown.map((order) => (
                        <div
                            key={order._id}
                            className="bg-white rounded-3xl border border-app-border p-5 sm:p-6 shadow-xs hover:shadow-sm transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-mono text-sm font-bold text-zinc-900">#{order._id}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusStyle(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                                        <Clock className="size-3 text-zinc-400" /> Placed on {orderDate(order.createdAt)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-base font-bold text-app-green">
                                        {currency} {order.total.toFixed(1)}
                                    </span>
                                    <Link
                                        to={`/orders/${order._id}`}
                                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-app-green text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                    >
                                        <Truck className="size-3.5" />
                                        {order.status === "Delivered" || order.status === "Cancelled" ? "View Details" : "Track Order"}
                                    </Link>
                                </div>
                            </div>

                            {/* Item previews */}
                            <div className="py-4 flex flex-wrap items-center gap-4">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                                        {item.image && <img src={item.image} alt={item.name} className="size-8 rounded object-contain" />}
                                        <span className="font-medium text-zinc-800 line-clamp-1 max-w-[150px]">{item.name}</span>
                                        <span className="text-zinc-500 font-semibold">×{item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Footer details */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-50 gap-2">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="size-3 text-zinc-400" />
                                    <span>{order.shippingAddress?.address}, {order.shippingAddress?.city}</span>
                                </div>
                                <div>
                                    Payment: <span className="font-semibold text-zinc-700">{order.paymentMethodName}</span>
                                    {order.isPaid && <span className="ml-1.5 text-emerald-600 font-semibold">· Paid</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyOrders;
