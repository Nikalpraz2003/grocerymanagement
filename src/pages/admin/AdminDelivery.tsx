import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, adminError, type AdminOrder, type DeliveryPartner } from "../../services/adminApi";
import { Badge, Drawer, ErrorBox, Field, PageHeader, Table, Td, btnDark, btnLight, dateTime, iconBtn, inputCls, rs } from "../../components/admin/ui";

type PartnerForm = { name: string; email: string; phone: string; avatar: string; vehicleType: string; vehicleNumber: string; isActive: boolean };
const emptyPartner: PartnerForm = { name: "", email: "", phone: "", avatar: "", vehicleType: "bike", vehicleNumber: "", isActive: true };

const PartnerDrawer = ({ partner, onClose, onSaved }: { partner: DeliveryPartner | null; onClose: () => void; onSaved: () => void }) => {
    const [form, setForm] = useState<PartnerForm>(partner ? {
        name: partner.name, email: partner.email, phone: partner.phone, avatar: partner.avatar,
        vehicleType: partner.vehicleType, vehicleNumber: partner.vehicleNumber, isActive: partner.isActive,
    } : emptyPartner);
    const [saving, setSaving] = useState(false);
    const set = (k: keyof PartnerForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            if (partner) await adminApi.updatePartner(partner._id, form); else await adminApi.createPartner(form);
            toast.success(partner ? "Rider updated" : "Rider added"); onSaved();
        } catch (err) { toast.error(adminError(err)); }
        finally { setSaving(false); }
    };

    return (
        <form onSubmit={save}>
            <Drawer title={partner ? "Edit rider" : "Add rider"} onClose={onClose}
                footer={<><button type="button" onClick={onClose} className={btnLight}>Cancel</button><button disabled={saving} className={btnDark}>{saving ? "Saving..." : "Save"}</button></>}>
                <Field label="Name *"><input required value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Phone *"><input required value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls} /></Field>
                    <Field label="Email *"><input required type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Vehicle">
                        <select value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)} className={inputCls}>
                            <option value="bike">Bike</option><option value="scooter">Scooter</option><option value="car">Car</option>
                        </select>
                    </Field>
                    <Field label="Vehicle number"><input value={form.vehicleNumber} onChange={e => set("vehicleNumber", e.target.value)} className={inputCls} placeholder="BA 12 PA 3456" /></Field>
                </div>
                <Field label="Photo URL"><input value={form.avatar} onChange={e => set("avatar", e.target.value)} className={inputCls} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} /> Active (can get orders)</label>
            </Drawer>
        </form>
    );
};

const AdminDelivery = () => {
    const [partners, setPartners] = useState<DeliveryPartner[]>([]);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<DeliveryPartner | null | "new">(null);
    const [pick, setPick] = useState<Record<string, string>>({});

    const load = async () => {
        setLoading(true); setError(null);
        try { const d = await adminApi.delivery(); setPartners(d.partners); setOrders(d.activeOrders); }
        catch (e) { setError(adminError(e, "Unable to load delivery")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, []);

    const remove = async (p: DeliveryPartner) => {
        if (!confirm(`Delete rider ${p.name}?`)) return;
        try { const r = await adminApi.deletePartner(p._id); toast.success(r.message); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };
    const assign = async (o: AdminOrder) => {
        const id = pick[o.orderNumber]; if (!id) return;
        try { await adminApi.assignRider(o.orderNumber, Number(id)); toast.success("Rider assigned"); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };
    const active = partners.filter(p => p.isActive);

    return (
        <section className="p-4 sm:p-8 max-w-[1400px] mx-auto">
            <PageHeader title="Delivery" subtitle="Riders and orders waiting to be delivered." loading={loading} onRefresh={() => void load()}>
                <button onClick={() => setEditing("new")} className={btnDark}><Plus size={16} /> Add rider</button>
            </PageHeader>
            {error && <ErrorBox message={error} />}

            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">Orders to deliver ({orders.length})</h2>
            <div className="mb-8">
                <Table head={["Order", "Deliver to", "Total", "Status", "Rider", "Assign"]} empty={orders.length === 0} loading={loading}>
                    {orders.map(o => (
                        <tr key={o._id} className="border-t border-[#e7e2d9]">
                            <Td><p className="font-medium">{o.orderNumber}</p><p className="text-[11px] text-[#9a948a]">{dateTime(o.createdAt)}</p></Td>
                            <Td><p>{o.shippingAddress.fullName}</p><p className="text-[11px] text-[#9a948a]">{o.shippingAddress.address}, {o.shippingAddress.city}</p></Td>
                            <Td>{rs(o.total)}</Td>
                            <Td><Badge label={o.status} /></Td>
                            <Td className="text-xs">{o.deliveryPartner?.name ?? <span className="text-amber-700">Not assigned</span>}</Td>
                            <Td><div className="flex gap-2">
                                <select value={pick[o.orderNumber] ?? ""} onChange={e => setPick(p => ({ ...p, [o.orderNumber]: e.target.value }))} className="px-2 py-1.5 border border-[#d9d4cb] bg-white text-sm">
                                    <option value="">Rider...</option>{active.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                                <button onClick={() => void assign(o)} disabled={!pick[o.orderNumber]} className={btnLight}>Assign</button>
                            </div></Td>
                        </tr>
                    ))}
                </Table>
            </div>

            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">Riders ({partners.length})</h2>
            <Table head={["Rider", "Phone", "Vehicle", "Active orders", "Status", ""]} empty={partners.length === 0} loading={loading}>
                {partners.map(p => (
                    <tr key={p._id} className="border-t border-[#e7e2d9]">
                        <Td><p className="font-medium">{p.name}</p><p className="text-[11px] text-[#9a948a]">{p.email}</p></Td>
                        <Td>{p.phone}</Td>
                        <Td className="capitalize">{p.vehicleType} <span className="text-[#9a948a]">{p.vehicleNumber}</span></Td>
                        <Td>{p.activeOrders}</Td>
                        <Td><Badge label={p.isActive ? "Active" : "Inactive"} /></Td>
                        <Td><div className="flex gap-2 justify-end">
                            <button onClick={() => setEditing(p)} className={iconBtn} title="Edit"><Edit3 size={15} /></button>
                            <button onClick={() => void remove(p)} className={iconBtn} title="Delete"><Trash2 size={15} className="text-red-500" /></button>
                        </div></Td>
                    </tr>
                ))}
            </Table>

            {editing && <PartnerDrawer partner={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
        </section>
    );
};

export default AdminDelivery;