import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, adminError, type AdminProduct, type Category, type SaveProduct } from "../../services/adminApi";
import { Badge, Drawer, ErrorBox, Field, PageHeader, SearchBox, Table, Td, btnDark, btnLight, iconBtn, inputCls, rs } from "../../components/admin/ui";
import ImageUpload from "../../components/ImageUpload";

const emptyForm: SaveProduct = {
    name: "", description: "", price: 0, originalPrice: 0, image: "", images: [], category: "", unit: "", stock: 0,
    lowStockThreshold: 10, isOrganic: false, isActive: true, highlights: [], storage: "", shelfLife: "",
    countryOfOrigin: "", dietaryTags: [], vendorId: null,
};

// Keeps every field (including vendorId) so editing never drops data
const toForm = (p: AdminProduct): SaveProduct => ({
    name: p.name, description: p.description, price: p.price, originalPrice: p.originalPrice, image: p.image, images: p.images ?? [],
    category: p.category, unit: p.unit, stock: p.stock, lowStockThreshold: p.lowStockThreshold, isOrganic: p.isOrganic,
    isActive: p.isActive, highlights: p.highlights ?? [], storage: p.storage ?? "", shelfLife: p.shelfLife ?? "",
    countryOfOrigin: p.countryOfOrigin ?? "", dietaryTags: p.dietaryTags ?? [], vendorId: p.vendorId ?? null,
});

const ProductDrawer = ({ product, categories, onClose, onSaved }: { product: AdminProduct | null; categories: Category[]; onClose: () => void; onSaved: () => void }) => {
    const [form, setForm] = useState<SaveProduct>(product ? toForm(product) : { ...emptyForm, category: categories[0]?.slug ?? "" });
    const [highlights, setHighlights] = useState((product?.highlights ?? []).join("\n"));
    const [tags, setTags] = useState((product?.dietaryTags ?? []).join(", "));
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof SaveProduct>(k: K, v: SaveProduct[K]) => setForm(f => ({ ...f, [k]: v }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.price <= 0) { toast.error("Price must be more than 0"); return; }
        const body: SaveProduct = {
            ...form,
            originalPrice: form.originalPrice > form.price ? form.originalPrice : form.price,
            images: form.image ? [form.image, ...form.images.filter(i => i !== form.image)] : form.images,
            highlights: highlights.split("\n").map(h => h.trim()).filter(Boolean),
            dietaryTags: tags.split(",").map(t => t.trim()).filter(Boolean),
        };
        setSaving(true);
        try {
            if (product) await adminApi.updateProduct(product._id, body); else await adminApi.createProduct(body);
            toast.success(product ? "Product updated" : "Product added"); onSaved();
        } catch (err) { toast.error(adminError(err)); }
        finally { setSaving(false); }
    };

    return (
        <form onSubmit={save}>
            <Drawer title={product ? "Edit product" : "Add product"} onClose={onClose} wide
                footer={<><button type="button" onClick={onClose} className={btnLight}>Cancel</button><button disabled={saving} className={btnDark}>{saving ? "Saving..." : product ? "Save changes" : "Add product"}</button></>}>
                {form.vendorId && <p className="text-xs bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2">This product belongs to a seller. Your changes keep it linked to them.</p>}
                <Field label="Product name *"><input required value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Category *">
                        <select required value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
                            {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}{c.isActive ? "" : " (hidden)"}</option>)}
                        </select>
                    </Field>
                    <Field label="Unit" hint="e.g. 1 kg, 500 g, 1 pack"><input value={form.unit} onChange={e => set("unit", e.target.value)} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Selling price (Rs.) *"><input required type="number" min={1} step="0.01" value={form.price || ""} onChange={e => set("price", Number(e.target.value))} className={inputCls} /></Field>
                    <Field label="Original price (Rs.)" hint="Higher than selling price shows a discount"><input type="number" min={0} step="0.01" value={form.originalPrice || ""} onChange={e => set("originalPrice", Number(e.target.value))} className={inputCls} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Stock *"><input required type="number" min={0} value={form.stock} onChange={e => set("stock", Number(e.target.value))} className={inputCls} /></Field>
                    <Field label="Low stock alert at"><input type="number" min={0} value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", Number(e.target.value))} className={inputCls} /></Field>
                </div>
                <div>
                    <span className="block text-xs font-semibold text-[#5f5a52] mb-1.5">Product photo</span>
                    <ImageUpload value={form.image} onChange={url => set("image", url)} inputClassName={inputCls} />
                </div>
                <Field label="Description"><textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} className={inputCls} /></Field>
                <Field label="Highlights" hint="One per line"><textarea rows={3} value={highlights} onChange={e => setHighlights(e.target.value)} className={inputCls} /></Field>
                <Field label="Dietary tags" hint="Comma separated, e.g. Vegan, Gluten free"><input value={tags} onChange={e => setTags(e.target.value)} className={inputCls} /></Field>
                <div className="grid grid-cols-3 gap-4">
                    <Field label="Storage"><input value={form.storage} onChange={e => set("storage", e.target.value)} className={inputCls} /></Field>
                    <Field label="Shelf life"><input value={form.shelfLife} onChange={e => set("shelfLife", e.target.value)} className={inputCls} /></Field>
                    <Field label="Country"><input value={form.countryOfOrigin} onChange={e => set("countryOfOrigin", e.target.value)} className={inputCls} /></Field>
                </div>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isOrganic} onChange={e => set("isOrganic", e.target.checked)} /> Organic</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} /> Show in shop</label>
                </div>
            </Drawer>
        </form>
    );
};

const AdminProducts = () => {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<AdminProduct | null | "new">(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setProducts(await adminApi.products(search, category, status)); }
        catch (e) { setError(adminError(e, "Unable to load products")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [category, status]);   // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { adminApi.categories().then(setCategories).catch(() => setCategories([])); }, []);

    const remove = async (p: AdminProduct) => {
        if (!confirm(`Delete "${p.name}"?`)) return;
        try { const r = await adminApi.deleteProduct(p._id); toast.success(r.message); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };

    return (
        <section className="p-4 sm:p-8 max-w-[1500px] mx-auto">
            <PageHeader title="Products" subtitle={`${products.length} products`} loading={loading} onRefresh={() => void load()}>
                <button onClick={() => setEditing("new")} disabled={categories.length === 0} className={btnDark}><Plus size={16} /> Add product</button>
            </PageHeader>
            <div className="flex flex-wrap gap-2 mb-5">
                <SearchBox value={search} onChange={setSearch} onSubmit={() => void load()} placeholder="Search products, press Enter..." />
                <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2.5 text-sm border border-[#d9d4cb] bg-white">
                    <option value="all">All categories</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2.5 text-sm border border-[#d9d4cb] bg-white">
                    <option value="all">All</option><option value="active">Showing in shop</option><option value="inactive">Hidden</option>
                </select>
            </div>
            {error && <ErrorBox message={error} />}
            <Table head={["Product", "Category", "Price", "Stock", "Rating", "Seller", "Status", ""]} empty={products.length === 0} loading={loading}>
                {products.map(p => (
                    <tr key={p._id} className="border-t border-[#e7e2d9]">
                        <Td><div className="flex items-center gap-3"><img src={p.image} alt="" className="size-11 object-cover bg-[#f0ece4]" /><div><p className="font-semibold text-xs">{p.name}</p><p className="text-[11px] text-[#9a948a]">{p.unit}</p></div></div></Td>
                        <Td className="text-xs">{p.categoryName}</Td>
                        <Td><span className="font-semibold">{rs(p.price)}</span>{p.discount > 0 && <span className="ml-1.5 text-[11px] text-[#9a948a] line-through">{rs(p.originalPrice)}</span>}</Td>
                        <Td>{p.stock === 0 ? <Badge label="Out of stock" /> : p.stock <= p.lowStockThreshold ? <span className="text-amber-700 font-semibold">{p.stock}</span> : p.stock}</Td>
                        <Td className="text-xs">{p.reviewCount > 0 ? `${p.rating.toFixed(1)} (${p.reviewCount})` : "-"}</Td>
                        <Td>{p.vendorId ? <Badge label="Vendor" /> : <span className="text-xs text-[#9a948a]">Pasalmandu</span>}</Td>
                        <Td><Badge label={p.isActive ? "Active" : "Hidden"} /></Td>
                        <Td><div className="flex gap-2 justify-end">
                            <button onClick={() => setEditing(p)} className={iconBtn} title="Edit"><Edit3 size={15} /></button>
                            <button onClick={() => void remove(p)} className={iconBtn} title="Delete"><Trash2 size={15} className="text-red-500" /></button>
                        </div></Td>
                    </tr>
                ))}
            </Table>
            {editing && <ProductDrawer product={editing === "new" ? null : editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
        </section>
    );
};

export default AdminProducts;