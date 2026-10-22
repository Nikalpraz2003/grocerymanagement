import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, adminError, type StoreSettings } from "../../services/adminApi";
import { ErrorBox, Field, PageHeader, btnDark, inputCls } from "../../components/admin/ui";

const AdminSettings = () => {
    const [form, setForm] = useState<StoreSettings | null>(null);
    const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { const s = await adminApi.settings(); setForm(s.store); setAdmin(s.admin); }
        catch (e) { setError(adminError(e, "Unable to load settings")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, []);

    const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setForm(f => f ? { ...f, [k]: v } : f);
    const num = (k: keyof StoreSettings) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

    const save = async (e: React.FormEvent) => {
        e.preventDefault(); if (!form) return;
        setSaving(true);
        try { setForm(await adminApi.saveSettings(form)); toast.success("Settings saved"); }
        catch (err) { toast.error(adminError(err)); }
        finally { setSaving(false); }
    };

    return (
        <section className="p-4 sm:p-8 max-w-[900px] mx-auto">
            <PageHeader title="Settings" subtitle={admin ? `Signed in as ${admin.name} (${admin.email})` : undefined} loading={loading} onRefresh={() => void load()} />
            {error && <ErrorBox message={error} />}
            {form && (
                <form onSubmit={save} className="space-y-6">
                    <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-6 space-y-4">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61]">Store</h2>
                        <Field label="Store name *"><input required value={form.storeName} onChange={e => set("storeName", e.target.value)} className={inputCls} /></Field>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Support email *"><input required type="email" value={form.supportEmail} onChange={e => set("supportEmail", e.target.value)} className={inputCls} /></Field>
                            <Field label="Support phone"><input value={form.supportPhone} onChange={e => set("supportPhone", e.target.value)} className={inputCls} /></Field>
                        </div>
                    </div>

                    <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-6 space-y-4">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61]">Checkout</h2>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <Field label="Delivery fee (Rs.)"><input type="number" min={0} step="0.01" value={form.deliveryFee} onChange={num("deliveryFee")} className={inputCls} /></Field>
                            <Field label="Free delivery above (Rs.)" hint="0 = never free"><input type="number" min={0} step="0.01" value={form.freeDeliveryThreshold} onChange={num("freeDeliveryThreshold")} className={inputCls} /></Field>
                            <Field label="Tax (%)"><input type="number" min={0} max={100} step="0.01" value={form.taxPercent} onChange={num("taxPercent")} className={inputCls} /></Field>
                        </div>
                    </div>

                    <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-6 space-y-4">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61]">Sellers & stock</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Default commission (%)" hint="Used for new seller applications"><input type="number" min={0} max={100} step="0.5" value={form.defaultCommissionPercent} onChange={num("defaultCommissionPercent")} className={inputCls} /></Field>
                            <Field label="Default low-stock alert"><input type="number" min={0} value={form.lowStockThreshold} onChange={num("lowStockThreshold")} className={inputCls} /></Field>
                        </div>
                    </div>

                    <div className="flex justify-end"><button disabled={saving} className={btnDark}><Save size={16} /> {saving ? "Saving..." : "Save settings"}</button></div>
                </form>
            )}
        </section>
    );
};

export default AdminSettings;