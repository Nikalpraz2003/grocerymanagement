import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Briefcase, CheckCircle2, Home, MapPin, Pencil, Phone, Plus, Star, Trash2, X } from "lucide-react";
import { shopApi, shopError, type SavedAddress, type SaveAddress } from "../services/shopApi";

const EMPTY: SaveAddress = {
    label: "Home", fullName: "", phone: "", address: "", city: "Kathmandu", state: "", zip: "",
    instructions: "", isDefault: false, lat: 0, lng: 0,
};

const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Kirtipur", "Pokhara", "Other"];

const inputCls =
    "w-full rounded-xl border border-app-border bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-app-green focus:ring-2 focus:ring-app-green/10";

const LabelIcon = ({ label }: { label: string }) =>
    label === "Work" ? <Briefcase className="size-4" /> : label === "Home" ? <Home className="size-4" /> : <MapPin className="size-4" />;

const Addresses = () => {
    const [list, setList] = useState<SavedAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
    const [form, setForm] = useState<SaveAddress>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setList(await shopApi.addresses());
        } catch (e) {
            setError(shopError(e, "Could not load your addresses"));
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { void load(); }, []);

    const openNew = () => { setForm({ ...EMPTY, isDefault: list.length === 0 }); setEditing("new"); };
    const openEdit = (a: SavedAddress) => {
        const { _id, ...rest } = a;
        void _id;
        setForm({ ...EMPTY, ...rest, state: rest.state ?? "", zip: rest.zip ?? "", instructions: rest.instructions ?? "" });
        setEditing(a);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
            toast.error("Name, phone, address and city are required.");
            return;
        }
        if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) {
            toast.error("Please enter a valid phone number.");
            return;
        }
        setSaving(true);
        try {
            const body = { ...form, fullName: form.fullName.trim(), phone: form.phone.trim(), address: form.address.trim() };
            if (editing === "new") await shopApi.addAddress(body);
            else if (editing) await shopApi.updateAddress(editing._id, body);
            toast.success(editing === "new" ? "Address added" : "Address updated");
            setEditing(null);
            await load();
        } catch (err) {
            toast.error(shopError(err, "Could not save the address"));
        } finally {
            setSaving(false);
        }
    };

    const makeDefault = async (a: SavedAddress) => {
        setBusyId(a._id);
        try {
            await shopApi.setDefaultAddress(a._id);
            setList((prev) => prev.map((x) => ({ ...x, isDefault: x._id === a._id })));
            toast.success(`"${a.label}" is now your default address`);
        } catch (err) {
            toast.error(shopError(err, "Could not change the default address"));
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (a: SavedAddress) => {
        if (!confirm(`Delete the "${a.label}" address?`)) return;
        setBusyId(a._id);
        try {
            await shopApi.deleteAddress(a._id);
            toast.success("Address deleted");
            await load();     // the API may pick a new default
        } catch (err) {
            toast.error(shopError(err, "Could not delete the address"));
        } finally {
            setBusyId(null);
        }
    };

    // Default first
    const sorted = [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

    return (
        <div className="min-h-screen bg-app-cream pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Link to="/profile" className="rounded-xl border border-app-border bg-white p-2.5 text-zinc-600 hover:text-app-orange" aria-label="Back to profile">
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">My Addresses</h1>
                            <p className="text-zinc-500 text-sm mt-0.5">Saved delivery addresses for faster checkout.</p>
                        </div>
                    </div>
                    <button
                        onClick={openNew}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-app-green hover:bg-app-green-light text-white rounded-xl transition-colors"
                    >
                        <Plus className="size-4" /> <span className="hidden sm:inline">Add Address</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
                        <span>{error}</span>
                        <button onClick={() => void load()} className="text-xs font-semibold underline">Try again</button>
                    </div>
                )}

                {loading && list.length === 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[1, 2].map((i) => <div key={i} className="h-44 bg-white rounded-2xl border border-app-border animate-pulse" />)}
                    </div>
                ) : !error && list.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-app-border p-10 text-center">
                        <MapPin className="size-12 text-zinc-300 mx-auto mb-3" />
                        <p className="font-semibold text-zinc-800">No saved addresses yet</p>
                        <p className="text-sm text-zinc-500 mt-1">Add one now and checkout will pick it automatically.</p>
                        <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl">
                            <Plus className="size-4" /> Add Address
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {sorted.map((a) => (
                            <div
                                key={a._id}
                                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col ${a.isDefault ? "border-app-green ring-1 ring-app-green/20" : "border-app-border"}`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="size-8 rounded-lg bg-orange-50 text-app-orange flex-center"><LabelIcon label={a.label} /></span>
                                        <span className="font-semibold text-zinc-900">{a.label || "Address"}</span>
                                    </div>
                                    {a.isDefault && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <CheckCircle2 className="size-3" /> Default
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm font-semibold text-zinc-900">{a.fullName}</p>
                                <p className="text-sm text-zinc-600 mt-0.5">{a.address}</p>
                                <p className="text-sm text-zinc-500">{[a.city, a.state, a.zip].filter(Boolean).join(", ")}</p>
                                <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5"><Phone className="size-3" /> {a.phone}</p>
                                {a.instructions && <p className="text-xs text-app-green bg-emerald-50/70 p-2 rounded-lg mt-2">"{a.instructions}"</p>}

                                <div className="mt-auto pt-4 flex items-center gap-2 border-t border-zinc-100 mt-4">
                                    <button onClick={() => openEdit(a)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg">
                                        <Pencil className="size-3.5" /> Edit
                                    </button>
                                    {!a.isDefault && (
                                        <button
                                            onClick={() => void makeDefault(a)}
                                            disabled={busyId === a._id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-app-green bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-60"
                                        >
                                            <Star className="size-3.5" /> Set default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => void remove(a)}
                                        disabled={busyId === a._id}
                                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-60"
                                    >
                                        <Trash2 className="size-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add / edit form */}
            {editing && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
                    onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setEditing(null); }}
                >
                    <form onSubmit={save} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">{editing === "new" ? "Add Address" : "Edit Address"}</h2>
                            <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            {["Home", "Work", "Other"].map((l) => (
                                <button
                                    type="button"
                                    key={l}
                                    onClick={() => setForm({ ...form, label: l })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${form.label === l ? "bg-app-green text-white border-app-green" : "bg-white text-zinc-600 border-app-border"}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-medium text-zinc-700">Recipient name *</span>
                                <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-medium text-zinc-700">Phone *</span>
                                <input className={inputCls} inputMode="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="mb-1.5 block text-xs font-medium text-zinc-700">Street address / house / landmark *</span>
                                <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-medium text-zinc-700">City *</span>
                                <select className={inputCls} value={CITIES.includes(form.city) ? form.city : "Other"} onChange={(e) => setForm({ ...form, city: e.target.value === "Other" ? "" : e.target.value })}>
                                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                                {!CITIES.slice(0, -1).includes(form.city) && (
                                    <input className={`${inputCls} mt-2`} placeholder="City name" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                                )}
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-medium text-zinc-700">Area / ward (optional)</span>
                                <input className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="mb-1.5 block text-xs font-medium text-zinc-700">Delivery instructions (optional)</span>
                                <textarea rows={2} className={inputCls} placeholder="e.g. Ring the bell twice" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
                            </label>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-zinc-700">
                            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-app-green" />
                            Use as my default delivery address
                        </label>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
                            <button type="submit" disabled={saving} className="rounded-xl bg-app-green px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                                {saving ? "Saving..." : "Save Address"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Addresses;
