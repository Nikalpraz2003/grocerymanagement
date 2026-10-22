import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, adminError, type Category } from "../../services/adminApi";
import { Badge, Drawer, ErrorBox, Field, PageHeader, Table, Td, btnDark, btnLight, iconBtn, inputCls } from "../../components/admin/ui";

type Form = { name: string; slug: string; image: string; isActive: boolean; sortOrder: number };

const CategoryDrawer = ({ category, nextSort, onClose, onSaved }: { category: Category | null; nextSort: number; onClose: () => void; onSaved: () => void }) => {
    const [form, setForm] = useState<Form>(category
        ? { name: category.name, slug: category.slug, image: category.image, isActive: category.isActive, sortOrder: category.sortOrder }
        : { name: "", slug: "", image: "", isActive: true, sortOrder: nextSort });
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            if (category) await adminApi.updateCategory(category._id, form); else await adminApi.createCategory(form);
            toast.success(category ? "Category updated" : "Category added"); onSaved();
        } catch (err) { toast.error(adminError(err)); }
        finally { setSaving(false); }
    };

    return (
        <form onSubmit={save}>
            <Drawer title={category ? "Edit category" : "Add category"} onClose={onClose}
                footer={<><button type="button" onClick={onClose} className={btnLight}>Cancel</button><button disabled={saving} className={btnDark}>{saving ? "Saving..." : "Save"}</button></>}>
                <Field label="Name *"><input required value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} placeholder="Fruits & Vegetables" /></Field>
                <Field label="Slug" hint="Used in links, e.g. fruits-vegetables. Leave empty to make it from the name.">
                    <input value={form.slug} onChange={e => set("slug", e.target.value)} className={inputCls} />
                </Field>
                {category && form.slug !== category.slug && <p className="text-xs text-amber-700">Changing the slug changes this category's link in the shop.</p>}
                <Field label="Image URL"><input value={form.image} onChange={e => set("image", e.target.value)} className={inputCls} /></Field>
                {form.image && <img src={form.image} alt="" className="size-20 object-cover border border-[#e7e2d9] bg-white" />}
                <Field label="Sort order" hint="Smaller numbers show first"><input type="number" value={form.sortOrder} onChange={e => set("sortOrder", Number(e.target.value))} className={inputCls} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} /> Show in shop</label>
            </Drawer>
        </form>
    );
};

const AdminCategories = () => {
    const [rows, setRows] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Category | null | "new">(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setRows(await adminApi.categories()); }
        catch (e) { setError(adminError(e, "Unable to load categories")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, []);

    const remove = async (c: Category) => {
        if (c.productCount > 0) { toast.error(`${c.name} has ${c.productCount} products. Move them first, or hide the category.`); return; }
        if (!confirm(`Delete ${c.name}?`)) return;
        try { const r = await adminApi.deleteCategory(c._id); toast.success(r.message); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };
    const toggle = async (c: Category) => {
        try { await adminApi.updateCategory(c._id, { name: c.name, slug: c.slug, image: c.image, sortOrder: c.sortOrder, isActive: !c.isActive }); toast.success(c.isActive ? "Hidden from shop" : "Showing in shop"); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };

    return (
        <section className="p-4 sm:p-8 max-w-[1200px] mx-auto">
            <PageHeader title="Categories" subtitle={`${rows.length} categories`} loading={loading} onRefresh={() => void load()}>
                <button onClick={() => setEditing("new")} className={btnDark}><Plus size={16} /> Add category</button>
            </PageHeader>
            {error && <ErrorBox message={error} />}
            <Table head={["Order", "Category", "Slug", "Products", "Status", ""]} empty={rows.length === 0} loading={loading}>
                {rows.map(c => (
                    <tr key={c._id} className="border-t border-[#e7e2d9]">
                        <Td className="text-[#9a948a]">{c.sortOrder}</Td>
                        <Td><div className="flex items-center gap-3">{c.image ? <img src={c.image} alt="" className="size-9 object-cover bg-[#f0ece4]" /> : <div className="size-9 bg-[#f0ece4]" />}<span className="font-medium">{c.name}</span></div></Td>
                        <Td className="text-xs text-[#777269]">{c.slug}</Td>
                        <Td>{c.productCount}</Td>
                        <Td><button onClick={() => void toggle(c)} title="Click to switch"><Badge label={c.isActive ? "Active" : "Hidden"} /></button></Td>
                        <Td><div className="flex gap-2 justify-end">
                            <button onClick={() => setEditing(c)} className={iconBtn} title="Edit"><Edit3 size={15} /></button>
                            <button onClick={() => void remove(c)} className={iconBtn} title="Delete"><Trash2 size={15} className="text-red-500" /></button>
                        </div></Td>
                    </tr>
                ))}
            </Table>
            {editing && <CategoryDrawer category={editing === "new" ? null : editing} nextSort={rows.length} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
        </section>
    );
};

export default AdminCategories;