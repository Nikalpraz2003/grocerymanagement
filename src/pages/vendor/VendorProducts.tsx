import { useEffect, useState } from "react";
import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { errorMessage, vendorApi, type Category, type SaveProduct, type VendorProduct } from "../../services/vendorApi";
import { Badge, ErrorBox, PageHeader, rs } from "./shared";
import ImageUpload from "../../components/ImageUpload";

const emptyForm: SaveProduct = {
    name: "", description: "", price: 0, originalPrice: 0, image: "", images: [], category: "", unit: "",
    stock: 0, lowStockThreshold: 10, isOrganic: false, isActive: true, highlights: [], storage: "",
    shelfLife: "", countryOfOrigin: "", dietaryTags: [],
};

const toForm = (p: VendorProduct): SaveProduct => ({
    name: p.name, description: p.description, price: p.price, originalPrice: p.originalPrice, image: p.image,
    images: p.images ?? [], category: p.category, unit: p.unit, stock: p.stock, lowStockThreshold: p.lowStockThreshold,
    isOrganic: p.isOrganic, isActive: p.isActive, highlights: p.highlights ?? [], storage: p.storage ?? "",
    shelfLife: p.shelfLife ?? "", countryOfOrigin: p.countryOfOrigin ?? "", dietaryTags: p.dietaryTags ?? [],
});

const input = "w-full px-3 py-2.5 bg-white border border-[#d9d4cb] text-sm outline-none focus:border-[#e66f43]";
const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <label className="block"><span className="block text-xs font-semibold text-[#5f5a52] mb-1.5">{label}</span>{children}{hint && <span className="block text-[11px] text-[#9a948a] mt-1">{hint}</span>}</label>
);

// ---------- Add / edit form ----------
const ProductForm = ({ product, categories, onClose, onSaved }: {
    product: VendorProduct | null; categories: Category[]; onClose: () => void; onSaved: () => void;
}) => {
    const [form, setForm] = useState<SaveProduct>(product ? toForm(product) : { ...emptyForm, category: categories[0]?.slug ?? "" });
    const [highlights, setHighlights] = useState((product?.highlights ?? []).join("\n"));
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof SaveProduct>(key: K, value: SaveProduct[K]) => setForm(f => ({ ...f, [key]: value }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.price <= 0) { toast.error("Price must be more than 0"); return; }
        const body: SaveProduct = {
            ...form,
            originalPrice: form.originalPrice > form.price ? form.originalPrice : form.price,
            images: form.image ? [form.image] : [],
            highlights: highlights.split("\n").map(h => h.trim()).filter(Boolean),
        };
        setSaving(true);
        try {
            if (product) await vendorApi.updateProduct(product._id, body);
            else await vendorApi.createProduct(body);
            toast.success(product ? "Product updated" : "Product added");
            onSaved();
        } catch (err) {
            toast.error(errorMessage(err, "Could not save the product"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
            <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-xl h-full bg-[#fbfaf7] overflow-y-auto">
                <div className="sticky top-0 bg-[#fbfaf7] border-b border-[#e7e2d9] px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-lg font-semibold">{product ? "Edit product" : "Add product"}</h2>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-[#f0ece4]"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <Field label="Product name *"><input required value={form.name} onChange={e => set("name", e.target.value)} className={input} placeholder="Fresh red apples" /></Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Category *">
                            <select required value={form.category} onChange={e => set("category", e.target.value)} className={input}>
                                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Unit" hint="e.g. 1 kg, 500 g, 1 pack"><input value={form.unit} onChange={e => set("unit", e.target.value)} className={input} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Selling price (Rs.) *"><input required type="number" min={1} step="0.01" value={form.price || ""} onChange={e => set("price", Number(e.target.value))} className={input} /></Field>
                        <Field label="Original price (Rs.)" hint="Higher than selling price shows a discount"><input type="number" min={0} step="0.01" value={form.originalPrice || ""} onChange={e => set("originalPrice", Number(e.target.value))} className={input} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Stock *"><input required type="number" min={0} value={form.stock} onChange={e => set("stock", Number(e.target.value))} className={input} /></Field>
                        <Field label="Low stock alert at"><input type="number" min={0} value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", Number(e.target.value))} className={input} /></Field>
                    </div>
                          <div>
                        <span className="block text-xs font-semibold text-[#5f5a52] mb-1.5">Product photo</span>
                        <ImageUpload value={form.image} onChange={url => set("image", url)} inputClassName={input} />
                    </div>
                         <Field label="Description"><textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} className={input} /></Field>
                    <Field label="Highlights" hint="One per line"><textarea rows={3} value={highlights} onChange={e => setHighlights(e.target.value)} className={input} /></Field>
                    <div className="grid grid-cols-3 gap-4">
                        <Field label="Storage"><input value={form.storage} onChange={e => set("storage", e.target.value)} className={input} /></Field>
                        <Field label="Shelf life"><input value={form.shelfLife} onChange={e => set("shelfLife", e.target.value)} className={input} /></Field>
                        <Field label="Country"><input value={form.countryOfOrigin} onChange={e => set("countryOfOrigin", e.target.value)} className={input} /></Field>
                    </div>
                    <div className="flex gap-6 pt-1">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isOrganic} onChange={e => set("isOrganic", e.target.checked)} /> Organic</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} /> Show in shop</label>
                    </div>
                </div>
                <div className="sticky bottom-0 bg-[#fbfaf7] border-t border-[#e7e2d9] px-6 py-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm border border-[#d9d4cb]">Cancel</button>
                    <button disabled={saving} className="px-4 py-2.5 text-sm font-semibold bg-[#202b23] text-white hover:bg-[#314237] disabled:opacity-60">{saving ? "Saving..." : product ? "Save changes" : "Add product"}</button>
                </div>
            </form>
        </div>
    );
};

// ---------- Product list ----------
const VendorProducts = () => {
    const [products, setProducts] = useState<VendorProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [editing, setEditing] = useState<VendorProduct | null | "new">(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setProducts(await vendorApi.products(search, status)); }
        catch (e) { setError(errorMessage(e, "Unable to load products")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [status]);   // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { vendorApi.categories().then(c => setCategories(c.filter(x => x.isActive))).catch(() => setCategories([])); }, []);

    const remove = async (p: VendorProduct) => {
        if (!confirm(`Delete "${p.name}"?`)) return;
        try { const res = await vendorApi.deleteProduct(p._id); toast.success(res.message); void load(); }
        catch (e) { toast.error(errorMessage(e, "Delete failed")); }
    };

    return (
        <section className="p-4 sm:p-8 max-w-[1400px] mx-auto">
            <PageHeader title="My products" subtitle={`${products.length} product${products.length === 1 ? "" : "s"}`} loading={loading} onRefresh={() => void load()}>
                <button onClick={() => setEditing("new")} disabled={categories.length === 0} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#202b23] text-white hover:bg-[#314237] disabled:opacity-50"><Plus size={16} /> Add product</button>
            </PageHeader>

            <form onSubmit={e => { e.preventDefault(); void load(); }} className="bg-[#fbfaf7] border border-[#d9d4cb] p-3 mb-5 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9a948a]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search and press Enter..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#d9d4cb] text-sm outline-none focus:border-[#e66f43]" /></div>
                <select value={status} onChange={e => setStatus(e.target.value)} className="sm:w-44 px-3 py-2.5 bg-white border border-[#d9d4cb] text-sm"><option value="all">All products</option><option value="active">Showing in shop</option><option value="inactive">Hidden</option></select>
            </form>

            {error && <ErrorBox message={error} />}

            <div className="bg-[#fbfaf7] border border-[#d9d4cb] overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#777269] bg-[#f3f0ea]"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead>
                    <tbody>{products.map(p => (
                        <tr key={p._id} className="border-t border-[#e7e2d9]">
                            <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={p.image} alt="" className="size-11 object-cover bg-[#f0ece4]" /><div><p className="font-semibold text-xs">{p.name}</p><p className="text-[11px] text-[#9a948a]">{p.unit}</p></div></div></td>
                            <td className="px-4 py-3 text-xs">{p.categoryName}</td>
                            <td className="px-4 py-3"><span className="font-semibold">{rs(p.price)}</span>{p.discount > 0 && <span className="ml-1.5 text-[11px] text-[#9a948a] line-through">{rs(p.originalPrice)}</span>}</td>
                            <td className="px-4 py-3">{p.stock === 0 ? <Badge label="Out of stock" /> : p.stock <= p.lowStockThreshold ? <span className="text-amber-700 font-semibold">{p.stock}</span> : p.stock}</td>
                            <td className="px-4 py-3 text-xs">{p.reviewCount > 0 ? `${p.rating.toFixed(1)} (${p.reviewCount})` : "-"}</td>
                            <td className="px-4 py-3"><Badge label={p.isActive ? "Active" : "Hidden"} /></td>
                            <td className="px-4 py-3"><div className="flex gap-2 justify-end">
                                <button onClick={() => setEditing(p)} className="p-2 border border-[#d9d4cb] hover:border-[#e66f43]" title="Edit"><Edit3 size={15} /></button>
                                <button onClick={() => void remove(p)} className="p-2 border border-red-100 text-red-500 hover:border-red-300" title="Delete"><Trash2 size={15} /></button>
                            </div></td>
                        </tr>
                    ))}</tbody>
                </table>
                {!loading && products.length === 0 && !error && <div className="p-12 text-center text-sm text-[#777269]">No products yet. Click <b>Add product</b> to list your first one.</div>}
            </div>

            {editing && (
                <ProductForm
                    product={editing === "new" ? null : editing}
                    categories={categories}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); void load(); }}
                />
            )}
        </section>
    );
};

export default VendorProducts;