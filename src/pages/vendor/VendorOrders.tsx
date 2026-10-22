import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, Search } from "lucide-react";
import toast from "react-hot-toast";
import { errorMessage, vendorApi, type VendorOrder } from "../../services/vendorApi";
import { Badge, ErrorBox, PageHeader, dateTime, rs } from "./shared";

const tabs = [["to-pack", "To pack"], ["ready", "Ready for pickup"], ["delivered", "Shipped"], ["cancelled", "Cancelled"], ["all", "All"]] as const;
const canPack = (o: VendorOrder) => o.packStatus !== "Ready" && ["Placed", "Confirmed", "Packed"].includes(o.orderStatus);

const OrderCard = ({ order, onPacked }: { order: VendorOrder; onPacked: () => void }) => {
    const [saving, setSaving] = useState(false);

    const markReady = async () => {
        setSaving(true);
        try { await vendorApi.markReady(order.orderNumber); toast.success(`${order.orderNumber} marked ready`); onPacked(); }
        catch (e) { toast.error(errorMessage(e, "Could not update the order")); }
        finally { setSaving(false); }
    };

    return (
        <div className="bg-[#fbfaf7] border border-[#d9d4cb]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#e7e2d9]">
                <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-[#9a948a] mt-0.5 flex items-center gap-1"><span>{dateTime(order.createdAt)} · {order.customerName}</span>{order.city && <><MapPin size={11} />{order.city}</>}</p>
                </div>
                <div className="flex items-center gap-2"><Badge label={order.orderStatus} /><Badge label={order.packStatus === "Ready" ? "Ready" : "Pending"} /></div>
            </div>
            <div className="px-5 py-2">
                {order.items.map(i => (
                    <div key={i._id} className="flex items-center gap-3 py-2">
                        <img src={i.image} alt="" className="size-10 object-cover bg-[#f0ece4]" />
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{i.name}</p><p className="text-[11px] text-[#9a948a]">{i.unit} · {rs(i.price)} each</p></div>
                        <p className="text-sm w-14 text-right">× {i.quantity}</p>
                        <p className="text-sm font-semibold w-24 text-right">{rs(i.lineTotal)}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-[#e7e2d9] bg-[#f6f3ee]">
                <p className="text-sm"><span className="text-[#777269]">Your items: </span><span className="font-semibold">{rs(order.itemsTotal)}</span><span className="text-xs text-[#9a948a] ml-2">{order.paymentMethodName}{order.isPaid ? " · Paid" : ""}</span></p>
                {canPack(order) ? (
                    <button onClick={() => void markReady()} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#e66f43] text-white hover:bg-[#d65f33] disabled:opacity-60"><CheckCircle2 size={16} />{saving ? "Saving..." : "Mark as packed"}</button>
                ) : order.packStatus === "Ready" ? (
                    <p className="text-xs text-green-800 font-semibold flex items-center gap-1"><CheckCircle2 size={14} /> Packed{order.items[0]?.packedAt ? ` ${dateTime(order.items[0].packedAt)}` : ""}</p>
                ) : null}
            </div>
        </div>
    );
};

const VendorOrders = () => {
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [tab, setTab] = useState("to-pack");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setOrders(await vendorApi.orders(tab, search)); }
        catch (e) { setError(errorMessage(e, "Unable to load orders")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [tab]);   // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <section className="p-4 sm:p-8 max-w-[1000px] mx-auto">
            <PageHeader title="Orders" subtitle="Only your products are shown in each order." loading={loading} onRefresh={() => void load()} />
            <div className="flex flex-wrap gap-2 mb-4">
                {tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`px-3 py-1.5 text-sm border ${tab === key ? "bg-[#202b23] text-white border-[#202b23]" : "bg-[#fbfaf7] border-[#d9d4cb] hover:border-[#e66f43]"}`}>{label}</button>)}
            </div>
            <form onSubmit={e => { e.preventDefault(); void load(); }} className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9a948a]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number or customer, press Enter..." className="w-full pl-9 pr-3 py-2.5 bg-[#fbfaf7] border border-[#d9d4cb] text-sm outline-none focus:border-[#e66f43]" />
            </form>
            {error && <ErrorBox message={error} />}
            <div className="space-y-4">
                {orders.map(o => <OrderCard key={o._id} order={o} onPacked={() => void load()} />)}
            </div>
            {!loading && orders.length === 0 && !error && (
                <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-12 text-center text-sm text-[#777269]">{tab === "to-pack" ? "Nothing to pack right now." : "No orders here."}</div>
            )}
        </section>
    );
};

export default VendorOrders;