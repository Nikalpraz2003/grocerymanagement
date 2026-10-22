import { useEffect, useState } from "react";
import { Bike, CheckCircle2, Eye, MapPin, Phone, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, adminError, type AdminOrder, type DeliveryPartner } from "../../services/adminApi";
import { Badge, Drawer, ErrorBox, Field, PageHeader, SearchBox, Table, Tabs, Td, btnDanger, btnLight, btnOrange, dateTime, iconBtn, inputCls, rs } from "../../components/admin/ui";

const tabs = [["all", "All"], ["Placed", "Placed"], ["Confirmed", "Confirmed"], ["Packed", "Packed"], ["Out for Delivery", "Out for delivery"], ["Delivered", "Delivered"], ["Cancelled", "Cancelled"], ["Awaiting Payment", "Unpaid online"]] as const;

// The usual next step for each status
const nextStatus: Record<string, string> = {
    Placed: "Confirmed",
    Confirmed: "Packed",
    Packed: "Out for Delivery",
    "Out for Delivery": "Delivered",
};
const isClosed = (s: string) => s === "Delivered" || s === "Cancelled";

// ---------- Order details + actions ----------
const OrderPanel = ({ orderNumber, onClose, onChanged }: { orderNumber: string; onClose: () => void; onChanged: () => void }) => {
    const [order, setOrder] = useState<AdminOrder | null>(null);
    const [partners, setPartners] = useState<DeliveryPartner[]>([]);
    const [note, setNote] = useState("");
    const [otp, setOtp] = useState("");
    const [rider, setRider] = useState("");
    const [busy, setBusy] = useState(false);

    const load = async () => {
        try { setOrder(await adminApi.order(orderNumber)); }
        catch (e) { toast.error(adminError(e, "Could not load the order")); onClose(); }
    };
    useEffect(() => {
        void load();
        adminApi.delivery().then(d => setPartners(d.partners.filter(p => p.isActive))).catch(() => setPartners([]));
    }, [orderNumber]);   // eslint-disable-line react-hooks/exhaustive-deps

    const run = async (action: () => Promise<unknown>, success: string) => {
        setBusy(true);
        try { await action(); toast.success(success); setNote(""); setOtp(""); await load(); onChanged(); }
        catch (e) { toast.error(adminError(e)); }
        finally { setBusy(false); }
    };

    if (!order) return <Drawer title={orderNumber} onClose={onClose} wide><p className="text-sm text-[#777269]">Loading...</p></Drawer>;

    const next = nextStatus[order.status];
    const awaitingPayment = order.status === "Awaiting Payment";

    return (
        <Drawer title={order.orderNumber} onClose={onClose} wide>
            <div className="flex flex-wrap items-center gap-2">
                <Badge label={order.status} /><Badge label={order.isPaid ? "Paid" : "Unpaid"} />
                <span className="text-xs text-[#9a948a]">{dateTime(order.createdAt)} · {order.paymentMethodName}</span>
            </div>

            {/* Unpaid eSewa / Khalti order */}
            {awaitingPayment && (
                <div className="border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                    <p className="font-semibold">The customer has not paid with {order.paymentMethodName} yet.</p>
                    <p className="text-xs mt-1">It becomes "Placed" by itself once the wallet confirms the payment. If it is not paid within 30 minutes it is cancelled automatically and the stock is released.</p>
                </div>
            )}

            {/* Actions */}
            {!isClosed(order.status) && (
                <div className="border border-[#e7e2d9] bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6f6a61]">Update order</p>
                    <Field label="Note (optional, shown in the order history)"><input value={note} onChange={e => setNote(e.target.value)} className={inputCls} /></Field>
                    {next === "Delivered" && (
                        <Field label="Delivery OTP from the customer (optional)" hint="If you type it, it must match. Leave empty to skip the check.">
                            <input value={otp} onChange={e => setOtp(e.target.value)} className={inputCls} />
                        </Field>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {next && <button disabled={busy} onClick={() => void run(() => adminApi.setOrderStatus(order.orderNumber, next, note, otp), `Order is now ${next}`)} className={btnOrange}><CheckCircle2 size={16} /> Mark as {next}</button>}
                        <button disabled={busy} onClick={() => { if (confirm("Cancel this order? Stock goes back to the products.")) void run(() => adminApi.setOrderStatus(order.orderNumber, "Cancelled", note || "Cancelled by admin"), "Order cancelled"); }} className={btnDanger}><XCircle size={16} /> Cancel order</button>
                        {!order.isPaid && !awaitingPayment && <button disabled={busy} onClick={() => void run(() => adminApi.markPaid(order.orderNumber), "Payment marked as received")} className={btnLight}>Mark as paid</button>}
                    </div>

                    {!awaitingPayment && (
                        <div className="pt-3 border-t border-[#f0ece4]">
                            <p className="text-xs font-semibold text-[#5f5a52] mb-1.5">Delivery rider {order.deliveryPartner && <span className="font-normal text-[#9a948a]">(now: {order.deliveryPartner.name})</span>}</p>
                            <div className="flex gap-2">
                                <select value={rider} onChange={e => setRider(e.target.value)} className={inputCls}>
                                    <option value="">Choose a rider...</option>
                                    {partners.map(p => <option key={p._id} value={p._id}>{p.name} · {p.vehicleType} · {p.activeOrders} active</option>)}
                                </select>
                                <button disabled={busy || !rider} onClick={() => void run(() => adminApi.assignRider(order.orderNumber, Number(rider)), "Rider assigned")} className={btnLight}><Bike size={16} /> Assign</button>
                            </div>
                            {partners.length === 0 && <p className="text-[11px] text-[#9a948a] mt-1">No active riders. Add one on the Delivery page.</p>}
                        </div>
                    )}
                </div>
            )}

            {/* Customer + address */}
            <div className="grid sm:grid-cols-2 gap-3">
                <div className="border border-[#e7e2d9] bg-white p-4 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6f6a61] mb-2">Customer</p>
                    <p className="font-medium">{order.user?.name ?? order.shippingAddress.fullName}</p>
                    <p className="text-[#777269]">{order.user?.email}</p>
                </div>
                <div className="border border-[#e7e2d9] bg-white p-4 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6f6a61] mb-2">Deliver to</p>
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                    <p className="text-[#777269] flex items-start gap-1"><MapPin size={13} className="mt-0.5 shrink-0" />{[order.shippingAddress.address, order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", ")}</p>
                    <p className="text-[#777269] flex items-center gap-1"><Phone size={13} />{order.shippingAddress.phone}</p>
                    {order.shippingAddress.instructions && <p className="text-xs text-[#9a948a] mt-1">"{order.shippingAddress.instructions}"</p>}
                </div>
            </div>

            {/* Items */}
            <div className="border border-[#e7e2d9] bg-white">
                {order.items.map((i, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f0ece4] last:border-0">
                        <img src={i.image} alt="" className="size-10 object-cover bg-[#f0ece4]" />
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{i.name}</p><p className="text-[11px] text-[#9a948a]">{i.unit} · {rs(i.price)} × {i.quantity}</p></div>
                        {i.packStatus === "Ready" && <span title="Packed by the seller"><Badge label="Ready" /></span>}
                        <p className="text-sm font-semibold w-24 text-right">{rs(i.lineTotal)}</p>
                    </div>
                ))}
                <div className="px-4 py-3 bg-[#f6f3ee] text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-[#777269]">Subtotal</span><span>{rs(order.subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-[#777269]">Delivery</span><span>{rs(order.deliveryFee)}</span></div>
                    {order.discount > 0 && <div className="flex justify-between"><span className="text-[#777269]">Discount {order.couponCode && `(${order.couponCode})`}</span><span>− {rs(order.discount)}</span></div>}
                    <div className="flex justify-between"><span className="text-[#777269]">Tax</span><span>{rs(order.tax)}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-[#e7e2d9]"><span>Total</span><span>{rs(order.total)}</span></div>
                </div>
            </div>

            {/* History */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6f6a61] mb-2">History</p>
                <ol className="border-l-2 border-[#e7e2d9] ml-1 space-y-3">
                    {order.statusHistory.map((h, idx) => (
                        <li key={idx} className="pl-4 relative">
                            <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-[#e66f43]" />
                            <p className="text-sm"><span className="font-medium">{h.status}</span>{h.note && <span className="text-[#777269]"> · {h.note}</span>}</p>
                            <p className="text-[11px] text-[#9a948a]">{dateTime(h.timestamp)}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </Drawer>
    );
};

// ---------- Order list ----------
const AdminOrders = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [tab, setTab] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setOrders(await adminApi.orders(tab, search)); }
        catch (e) { setError(adminError(e, "Unable to load orders")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [tab]);   // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <section className="p-4 sm:p-8 max-w-[1500px] mx-auto">
            <PageHeader title="Orders" subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`} loading={loading} onRefresh={() => void load()} />
            <Tabs value={tab} onChange={setTab} options={tabs} />
            <div className="flex gap-2 mb-5"><SearchBox value={search} onChange={setSearch} onSubmit={() => void load()} placeholder="Search order number, customer name, email or phone, press Enter..." /></div>
            {error && <ErrorBox message={error} />}
            <Table head={["Order", "Customer", "Items", "Total", "Payment", "Status", "Rider", ""]} empty={orders.length === 0} loading={loading}>
                {orders.map(o => (
                    <tr key={o._id} className="border-t border-[#e7e2d9] hover:bg-white cursor-pointer" onClick={() => setOpen(o.orderNumber)}>
                        <Td><p className="font-medium">{o.orderNumber}</p><p className="text-[11px] text-[#9a948a]">{dateTime(o.createdAt)}</p></Td>
                        <Td><p>{o.user?.name ?? o.shippingAddress.fullName}</p><p className="text-[11px] text-[#9a948a]">{o.shippingAddress.city}</p></Td>
                        <Td>{o.items.reduce((n, i) => n + i.quantity, 0)}</Td>
                        <Td className="font-semibold">{rs(o.total)}</Td>
                        <Td><Badge label={o.isPaid ? "Paid" : "Unpaid"} /><p className="text-[11px] text-[#9a948a] mt-0.5">{o.paymentMethod.toUpperCase()}</p></Td>
                        <Td><Badge label={o.status} /></Td>
                        <Td className="text-xs">{o.deliveryPartner?.name ?? "-"}</Td>
                        <Td><button className={iconBtn} title="Open"><Eye size={15} /></button></Td>
                    </tr>
                ))}
            </Table>
            {open && <OrderPanel orderNumber={open} onClose={() => setOpen(null)} onChanged={() => void load()} />}
        </section>
    );
};

export default AdminOrders;