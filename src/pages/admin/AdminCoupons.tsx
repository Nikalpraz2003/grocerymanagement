import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, adminError, type Coupon } from "../../services/adminApi";
import { Badge, Drawer, ErrorBox, Field, PageHeader, Table, Td, btnDark, btnLight, iconBtn, inputCls, rs, shortDate } from "../../components/admin/ui";

type Kind = "percent" | "flat" | "shipping";
type Form = { code: string; description: string; kind: Kind; amount: string; maxDiscount: string; freeShipping: boolean; minOrderAmount: string; usageLimit: string; expiresAt: string; isActive: boolean };

const toForm = (c: Coupon | null): Form => c ? {
    code: c.code, description: c.description,
    kind: c.discountPercent ? "percent" : c.discountFlat ? "flat" : "shipping",
    amount: String(c.discountPercent ?? c.discountFlat ?? ""), maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
    freeShipping: c.freeShipping, minOrderAmount: String(c.minOrderAmount ?? 0), usageLimit: c.usageLimit ? String(c.usageLimit) : "",
    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "", isActive: c.isActive,
} : { code: "", description: "", kind: "percent", amount: "", maxDiscount: "", freeShipping: false, minOrderAmount: "0", usageLimit: "", expiresAt: "", isActive: true };

const describe = (c: Coupon) => [
    c.discountPercent ? `${c.discountPercent}% off${c.maxDiscount ? ` (max ${rs(c.maxDiscount)})` : ""}` : null,
    c.discountFlat ? `${rs(c.discountFlat)} off` : null,
    c.freeShipping ? "Free delivery" : null,
].filter(Boolean).join(" + ");

const CouponDrawer = ({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) => {
    const [f, setF] = useState<Form>(toForm(coupon));
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof Form>(k: K, v: Form[K]) => setF(x => ({ ...x, [k]: v }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(f.amount) || 0;
        if (f.kind !== "shipping" && amount <= 0) { toast.error("Enter the discount amount"); return; }
        if (f.kind === "percent" && amount > 100) { toast.error("Percent must be 100 or less"); return; }
        const body = {
            code: f.code.trim(), description: f.description.trim(),
            discountPercent: f.kind === "percent" ? amount : null,
            discountFlat: f.kind === "flat" ? amount : null,
            maxDiscount: f.kind === "percent" && Number(f.maxDiscount) > 0 ? Number(f.maxDiscount) : null,
            freeShipping: f.kind === "shipping" || f.freeShipping,
            minOrderAmount: Number(f.minOrderAmount) || 0,
            usageLimit: Number(f.usageLimit) > 0 ? Number(f.usageLimit) : null,
            expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : null,
            isActive: f.isActive,
        };
        setSaving(true);
        try {
            if (coupon) await adminApi.updateCoupon(coupon._id, body); else await adminApi.createCoupon(body);
            toast.success(coupon ? "Coupon updated" : "Coupon created"); onSaved();
        } catch (err) { toast.error(adminError(err)); }
        finally { setSaving(false); }
    };

    return (
        <form onSubmit={save}>
            <Drawer title={coupon ? `Edit ${coupon.code}` : "New coupon"} onClose={onClose}
                footer={<><button type="button" onClick={onClose} className={btnLight}>Cancel</button><button disabled={saving} className={btnDark}>{saving ? "Saving..." : "Save"}</button></>}>
                <Field label="Code *" hint="Letters, numbers, - and _ only. Saved in CAPITALS.">
                    <input required pattern="[A-Za-z0-9_\-]+" value={f.code} onChange={e => set("code", e.target.value.toUpperCase())} className={inputCls} placeholder="DASHAIN20" />
                </Field>
                <Field label="Description"><input value={f.description} onChange={e => set("description", e.target.value)} className={inputCls} placeholder="20% off for Dashain" /></Field>
                <Field label="Type of discount">
                    <select value={f.kind} onChange={e => set("kind", e.target.value as Kind)} className={inputCls}>
                        <option value="percent">Percent off (%)</option>
                        <option value="flat">Fixed amount off (Rs.)</option>
                        <option value="shipping">Free delivery only</option>
                    </select>
                </Field>
                {f.kind !== "shipping" && (
                    <div className="grid grid-cols-2 gap-4">
                        <Field label={f.kind === "percent" ? "Percent *" : "Amount (Rs.) *"}><input type="number" min={0} step="0.01" value={f.amount} onChange={e => set("amount", e.target.value)} className={inputCls} /></Field>
                        {f.kind === "percent" && <Field label="Max discount (Rs.)" hint="Optional cap"><input type="number" min={0} value={f.maxDiscount} onChange={e => set("maxDiscount", e.target.value)} className={inputCls} /></Field>}
                    </div>
                )}
                {f.kind !== "shipping" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.freeShipping} onChange={e => set("freeShipping", e.target.checked)} /> Also give free delivery</label>}
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Minimum order (Rs.)"><input type="number" min={0} value={f.minOrderAmount} onChange={e => set("minOrderAmount", e.target.value)} className={inputCls} /></Field>
                    <Field label="Usage limit" hint="Empty = unlimited"><input type="number" min={1} value={f.usageLimit} onChange={e => set("usageLimit", e.target.value)} className={inputCls} /></Field>
                </div>
                <Field label="Expires on" hint="Empty = never"><input type="date" value={f.expiresAt} onChange={e => set("expiresAt", e.target.value)} className={inputCls} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={e => set("isActive", e.target.checked)} /> Active</label>
            </Drawer>
        </form>
    );
};

const AdminCoupons = () => {
    const [rows, setRows] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Coupon | null | "new">(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setRows(await adminApi.coupons()); }
        catch (e) { setError(adminError(e, "Unable to load coupons")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, []);

    const remove = async (c: Coupon) => {
        if (!confirm(`Delete coupon ${c.code}?`)) return;
        try { const r = await adminApi.deleteCoupon(c._id); toast.success(r.message); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };
    const expired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();

    return (
        <section className="p-4 sm:p-8 max-w-[1300px] mx-auto">
            <PageHeader title="Coupons" subtitle={`${rows.length} coupons`} loading={loading} onRefresh={() => void load()}>
                <button onClick={() => setEditing("new")} className={btnDark}><Plus size={16} /> New coupon</button>
            </PageHeader>
            {error && <ErrorBox message={error} />}
            <Table head={["Code", "Discount", "Min order", "Used", "Expires", "Status", ""]} empty={rows.length === 0} loading={loading}>
                {rows.map(c => (
                    <tr key={c._id} className="border-t border-[#e7e2d9]">
                        <Td><p className="font-semibold tracking-wide">{c.code}</p><p className="text-[11px] text-[#9a948a]">{c.description}</p></Td>
                        <Td className="text-xs">{describe(c)}</Td>
                        <Td>{c.minOrderAmount > 0 ? rs(c.minOrderAmount) : "-"}</Td>
                        <Td>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</Td>
                        <Td className="text-xs">{c.expiresAt ? shortDate(c.expiresAt) : "Never"}</Td>
                        <Td><Badge label={expired(c) ? "Expired" : c.isActive ? "Active" : "Inactive"} /></Td>
                        <Td><div className="flex gap-2 justify-end">
                            <button onClick={() => setEditing(c)} className={iconBtn} title="Edit"><Edit3 size={15} /></button>
                            <button onClick={() => void remove(c)} className={iconBtn} title="Delete"><Trash2 size={15} className="text-red-500" /></button>
                        </div></Td>
                    </tr>
                ))}
            </Table>
            {editing && <CouponDrawer coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
        </section>
    );
};

export default AdminCoupons;