import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    MapPin,
    Phone,
    ShieldCheck,
    ArrowLeft,
    ChevronRight,
    ShoppingBag,
    Share2,
    Bike,
    XCircle,
    RefreshCw,
    Package,
} from "lucide-react";
import toast from "react-hot-toast";
import { shopApi, shopError, statusStyle, orderDate, goToPayment, ORDER_STEPS, type ShopOrder } from "../services/shopApi";

// Text for each step of the timeline
const STEP_TEXT: Record<string, { title: string; desc: string }> = {
    "Placed": { title: "Order Placed", desc: "We received your order" },
    "Confirmed": { title: "Order Confirmed", desc: "The store accepted your grocery list" },
    "Packed": { title: "Freshly Packed", desc: "Items inspected & bagged" },
    "Out for Delivery": { title: "Out for Delivery", desc: "Rider is heading to your address" },
    "Delivered": { title: "Delivered", desc: "Delivered to your doorstep" },
};

const timeOnly = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const OrderTracking = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs.";

    const [order, setOrder] = useState<ShopOrder | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [paying, setPaying] = useState(false);

    const payNow = async () => {
        if (!order) return;
        setPaying(true);
        try {
            await goToPayment(order._id, order.paymentMethod);   // leaves for eSewa / Khalti
        } catch (e) {
            toast.error(shopError(e, "Could not open the payment page"));
            setPaying(false);
        }
    };

    const load = useCallback(async (quiet = false) => {
        if (!id) return;
        if (!quiet) setLoading(true);
        try {
            setOrder(await shopApi.order(id));
            setError(null);
        } catch (e) {
            if (!quiet) setError(shopError(e, "Order not found"));
        } finally {
            if (!quiet) setLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    // Refresh every 30 seconds while the order is still moving
    const active = !!order && order.status !== "Delivered" && order.status !== "Cancelled";
    useEffect(() => {
        if (!active) return;
        const t = setInterval(() => void load(true), 30000);
        return () => clearInterval(t);
    }, [active, load]);

    const handleCancel = async () => {
        if (!order) return;
        if (!confirm(`Cancel order #${order._id}?`)) return;
        setCancelling(true);
        try {
            setOrder(await shopApi.cancelOrder(order._id));
            toast.success("Your order was cancelled");
        } catch (e) {
            toast.error(shopError(e, "Could not cancel this order"));
        } finally {
            setCancelling(false);
        }
    };

    if (loading && !order) {
        return (
            <div className="min-h-screen bg-app-cream flex-center">
                <p className="text-zinc-600 p-8">Loading your delivery details...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
                <Package className="size-12 text-zinc-300" />
                <p className="text-lg font-semibold text-zinc-800">{error || "Order not found"}</p>
                <Link to="/orders" className="px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl">Back to my orders</Link>
            </div>
        );
    }

    const cancelled = order.status === "Cancelled";
    const awaitingPayment = order.status === "Awaiting Payment";
    const canCancel = awaitingPayment || order.status === "Placed" || order.status === "Confirmed";
    const currentIdx = ORDER_STEPS.indexOf(order.status as (typeof ORDER_STEPS)[number]);
    // When each step happened (from the order's history)
    const stepTime = (step: string) => {
        const h = [...order.statusHistory].reverse().find((x) => x.status === step);
        return h ? timeOnly(h.timestamp) : "";
    };
    const cancelEntry = order.statusHistory.find((x) => x.status === "Cancelled");
    const rider = order.deliveryPartner;

    const headline =
        cancelled ? "Order cancelled"
            : awaitingPayment ? `Waiting for your ${order.paymentMethodName} payment`
            : order.status === "Delivered" ? "Delivered"
            : order.status === "Out for Delivery" ? "Rider is on the way"
            : order.status === "Packed" ? "Packed & waiting for a rider"
            : order.status === "Confirmed" ? "Store is preparing your order"
            : "Waiting for the store to confirm";

    return (
        <div className="min-h-screen bg-app-cream pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-app-green transition-colors">
                        <ArrowLeft className="size-4" /> Back
                    </button>
                    <ChevronRight className="size-3 text-zinc-400" />
                    <Link to="/orders" className="hover:text-app-green transition-colors">Orders</Link>
                    <ChevronRight className="size-3 text-zinc-400" />
                    <span className="text-zinc-700 font-medium">#{order._id}</span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle(order.status)}`}>{order.status}</span>
                            <span className="text-xs text-zinc-500">{orderDate(order.createdAt)}</span>
                            <button onClick={() => void load()} className="p-1 text-zinc-400 hover:text-app-green" title="Refresh">
                                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-900 mt-1">Order #{order._id}</h1>
                    </div>

                    {!cancelled && !awaitingPayment && order.status !== "Delivered" && order.deliveryOtp && (
                        <div className="bg-white rounded-2xl border border-app-border p-3.5 shadow-xs flex items-center gap-3 self-start sm:self-auto">
                            <div className="size-10 rounded-xl bg-orange-50 text-app-orange flex-center shrink-0">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Share OTP with Rider on Delivery</span>
                                <span className="font-mono text-xl font-bold tracking-widest text-app-green">{order.deliveryOtp}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: status + timeline */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-3xl border border-app-border p-6 shadow-xs overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {active && <div className="size-2.5 rounded-full bg-emerald-500 animate-ping" />}
                                    <span className={`text-xs font-bold uppercase tracking-wide ${cancelled ? "text-red-600" : "text-zinc-900"}`}>{headline}</span>
                                </div>
                                <span className="text-xs font-semibold text-app-orange bg-orange-50 px-2.5 py-1 rounded-full">{order.deliverySlot}</span>
                            </div>

                            {/* Route illustration (only while the rider is on the way) */}
                            {order.status === "Out for Delivery" && (
                                <div className="relative h-56 w-full rounded-2xl bg-zinc-900 overflow-hidden flex-center border border-zinc-800">
                                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:16px_16px]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-900/40" />
                                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M 80,170 Q 200,60 380,110 T 540,70" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="6 6" className="animate-pulse" />
                                    </svg>
                                    <div className="absolute left-16 bottom-10 flex flex-col items-center">
                                        <div className="size-8 rounded-full bg-orange-500 text-white flex-center shadow-lg border-2 border-white"><ShoppingBag className="size-4" /></div>
                                        <span className="text-[10px] font-bold text-white mt-1 bg-black/60 px-2 py-0.5 rounded">Pasalmandu Hub</span>
                                    </div>
                                    <div className="absolute left-1/2 top-16 -translate-x-1/2 flex flex-col items-center animate-bounce">
                                        <div className="size-10 rounded-full bg-emerald-500 text-white flex-center shadow-xl border-2 border-white"><Bike className="size-5" /></div>
                                        <span className="text-[11px] font-bold text-emerald-300 mt-1 bg-black/70 px-2 py-0.5 rounded">
                                            {rider ? `Rider ${rider.name.split(" ")[0]}` : "Rider"}
                                        </span>
                                    </div>
                                    <div className="absolute right-14 top-12 flex flex-col items-center">
                                        <div className="size-8 rounded-full bg-red-500 text-white flex-center shadow-lg border-2 border-white"><MapPin className="size-4" /></div>
                                        <span className="text-[10px] font-bold text-white mt-1 bg-black/60 px-2 py-0.5 rounded">Your Doorstep</span>
                                    </div>
                                </div>
                            )}

                            {awaitingPayment && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                    <div className="text-sm">
                                        <p className="font-semibold text-amber-800">This order is not paid yet.</p>
                                        <p className="text-amber-700 text-xs mt-1">Pay within 30 minutes of ordering, or it is cancelled automatically and the items are released.</p>
                                    </div>
                                    <button onClick={() => void payNow()} disabled={paying}
                                        className="px-4 py-2 bg-app-green text-white text-xs font-semibold rounded-xl disabled:opacity-60 whitespace-nowrap">
                                        {paying ? "Opening..." : `Pay now (${currency} ${order.total.toFixed(1)})`}
                                    </button>
                                </div>
                            )}

                            {cancelled && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                                    <XCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-red-700">This order was cancelled{cancelEntry ? ` on ${timeOnly(cancelEntry.timestamp)}` : ""}.</p>
                                        {cancelEntry?.note && <p className="text-red-600 text-xs mt-1">{cancelEntry.note}</p>}
                                        {order.isPaid && <p className="text-red-600 text-xs mt-1">Your online payment will be refunded.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="mt-8 space-y-6">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Order Progress Timeline</h3>
                                <div className="space-y-4">
                                    {ORDER_STEPS.map((step, idx) => {
                                        const time = stepTime(step);
                                        const completed = cancelled ? !!time : idx <= currentIdx;
                                        const isActive = !cancelled && idx === currentIdx && step !== "Delivered";
                                        return (
                                            <div key={step} className="flex items-start gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`size-7 rounded-full flex-center text-xs font-bold ${
                                                        isActive ? "bg-app-orange text-white ring-4 ring-orange-100"
                                                            : completed ? "bg-emerald-600 text-white"
                                                            : "bg-zinc-200 text-zinc-400"
                                                    }`}>
                                                        {completed ? <CheckCircle2 className="size-4" /> : idx + 1}
                                                    </div>
                                                    {idx < ORDER_STEPS.length - 1 && (
                                                        <div className={`w-0.5 h-10 my-1 ${completed && idx < currentIdx ? "bg-emerald-600" : "bg-zinc-200"}`} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className={`text-sm font-bold ${isActive ? "text-app-orange" : completed ? "text-zinc-900" : "text-zinc-400"}`}>
                                                            {STEP_TEXT[step].title}
                                                        </h4>
                                                        <span className="text-xs font-medium text-zinc-500">{time || (isActive ? "Now" : "")}</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mt-0.5">{STEP_TEXT[step].desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {canCancel && (
                                <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center justify-between gap-3">
                                    <p className="text-xs text-zinc-500">{awaitingPayment ? "Changed your mind? Cancel before paying." : "You can cancel until the store packs your order."}</p>
                                    <button
                                        onClick={() => void handleCancel()}
                                        disabled={cancelling}
                                        className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl disabled:opacity-60"
                                    >
                                        {cancelling ? "Cancelling..." : "Cancel Order"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: rider, address, items */}
                    <div className="lg:col-span-5 space-y-6">
                        {!cancelled && (
                            <div className="bg-white rounded-3xl border border-app-border p-6 shadow-xs">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Delivery Partner</h3>
                                {rider ? (
                                    <>
                                        <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
                                            <div className="size-14 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex-center overflow-hidden">
                                                {rider.avatar
                                                    ? <img src={rider.avatar} alt={rider.name} className="w-full h-full object-cover" />
                                                    : <Bike className="size-6 text-emerald-700" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-base font-bold text-zinc-900">{rider.name}</h4>
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    {[rider.vehicleType, rider.vehicleNumber].filter(Boolean).join(" · ")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-2">
                                            <a
                                                href={`tel:${rider.phone}`}
                                                className="flex-1 py-2.5 bg-app-green hover:bg-app-green-light text-white font-semibold rounded-xl text-xs flex-center gap-2 transition-colors shadow-2xs"
                                            >
                                                <Phone className="size-3.5" /> Call Rider ({rider.phone})
                                            </a>
                                            <button
                                                onClick={() => { void navigator.clipboard.writeText(window.location.href); toast.success("Tracking link copied!"); }}
                                                className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors"
                                                title="Share tracking link"
                                            >
                                                <Share2 className="size-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-zinc-500">
                                        {order.status === "Delivered" ? "Delivered by our team." : "A rider will be assigned once your order is packed."}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="bg-white rounded-3xl border border-app-border p-6 shadow-xs">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <MapPin className="size-3.5 text-app-orange" /> Delivery Address
                            </h3>
                            <p className="text-sm font-bold text-zinc-900">{order.shippingAddress.fullName}</p>
                            <p className="text-xs text-zinc-600 mt-1">{order.shippingAddress.address}</p>
                            <p className="text-xs text-zinc-500">{order.shippingAddress.city}, Nepal</p>
                            <p className="text-xs text-zinc-500 mt-1">📞 {order.shippingAddress.phone}</p>
                            {order.shippingAddress.instructions && (
                                <p className="text-xs text-app-green bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 mt-2.5">
                                    "{order.shippingAddress.instructions}"
                                </p>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl border border-app-border p-6 shadow-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Order Items ({order.items.length})</h3>
                                <span className="text-xs font-semibold text-zinc-800">
                                    {order.paymentMethodName}{order.isPaid ? " · Paid" : ""}
                                </span>
                            </div>

                            <div className="py-3 divide-y divide-zinc-100 max-h-60 overflow-y-auto pr-1">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} className="size-9 rounded-lg object-contain bg-zinc-50 border border-zinc-100 p-1" />
                                            )}
                                            <div className="min-w-0">
                                                <Link to={`/product/${item.product}`} className="font-semibold text-zinc-900 truncate hover:text-app-green block">{item.name}</Link>
                                                <p className="text-[11px] text-zinc-500">Qty: {item.quantity} × {currency} {item.price}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-zinc-900">{currency} {item.lineTotal.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-zinc-100 pt-3 space-y-1.5 text-xs text-zinc-600">
                                <div className="flex justify-between"><span>Subtotal</span><span>{currency} {order.subtotal.toFixed(1)}</span></div>
                                <div className="flex justify-between">
                                    <span>Delivery</span>
                                    <span>{order.deliveryFee === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : `${currency} ${order.deliveryFee.toFixed(1)}`}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                                        <span>− {currency} {order.discount.toFixed(1)}</span>
                                    </div>
                                )}
                                {order.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{currency} {order.tax.toFixed(1)}</span></div>}
                            </div>
                            <div className="border-t border-zinc-100 mt-3 pt-3 flex items-center justify-between font-bold">
                                <span className="text-xs text-zinc-700">Total Amount</span>
                                <span className="text-base text-app-green">{currency} {order.total.toFixed(1)}</span>
                            </div>
                            {order.notes && <p className="text-[11px] text-zinc-500 mt-3">Note: {order.notes}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
