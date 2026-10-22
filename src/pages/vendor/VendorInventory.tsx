import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { errorMessage, vendorApi, type InventoryItem } from "../../services/vendorApi";
import { Badge, ErrorBox, PageHeader } from "./shared";

const filters = [["all", "All"], ["low", "Low stock"], ["out", "Out of stock"]] as const;

// One row with its own editable stock box
const StockRow = ({ item, onSaved }: { item: InventoryItem; onSaved: (i: InventoryItem) => void }) => {
    const [stock, setStock] = useState(String(item.stock));
    const [alertAt, setAlertAt] = useState(String(item.lowStockThreshold));
    const [saving, setSaving] = useState(false);
    const changed = Number(stock) !== item.stock || Number(alertAt) !== item.lowStockThreshold;

    const save = async () => {
        if (Number(stock) < 0 || Number.isNaN(Number(stock))) { toast.error("Stock must be 0 or more"); return; }
        setSaving(true);
        try { onSaved(await vendorApi.updateStock(item._id, Number(stock), Number(alertAt))); toast.success(`${item.name} updated`); }
        catch (e) { toast.error(errorMessage(e, "Could not update stock")); }
        finally { setSaving(false); }
    };

    return (
        <tr className="border-t border-[#e7e2d9]">
            <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={item.image} alt="" className="size-10 object-cover bg-[#f0ece4]" /><div><p className="font-semibold text-xs">{item.name}</p><p className="text-[11px] text-[#9a948a]">{item.category} · {item.unit}</p></div></div></td>
            <td className="px-4 py-3"><Badge label={item.stockStatus} /></td>
            <td className="px-4 py-3"><input type="number" min={0} value={stock} onChange={e => setStock(e.target.value)} onKeyDown={e => e.key === "Enter" && changed && void save()} className="w-24 px-2 py-1.5 border border-[#d9d4cb] bg-white text-sm outline-none focus:border-[#e66f43]" /></td>
            <td className="px-4 py-3"><input type="number" min={0} value={alertAt} onChange={e => setAlertAt(e.target.value)} className="w-20 px-2 py-1.5 border border-[#d9d4cb] bg-white text-sm outline-none focus:border-[#e66f43]" /></td>
            <td className="px-4 py-3 text-right"><button onClick={() => void save()} disabled={!changed || saving} className="px-3 py-1.5 text-xs font-semibold bg-[#202b23] text-white disabled:opacity-30">{saving ? "Saving" : "Save"}</button></td>
        </tr>
    );
};

const VendorInventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setItems(await vendorApi.inventory(filter)); }
        catch (e) { setError(errorMessage(e, "Unable to load inventory")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [filter]);   // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <section className="p-4 sm:p-8 max-w-[1200px] mx-auto">
            <PageHeader title="Inventory" subtitle="Update stock and when you want a low-stock alert." loading={loading} onRefresh={() => void load()} />
            <div className="flex gap-2 mb-5">
                {filters.map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 text-sm border ${filter === key ? "bg-[#202b23] text-white border-[#202b23]" : "bg-[#fbfaf7] border-[#d9d4cb] hover:border-[#e66f43]"}`}>{label}</button>)}
            </div>
            {error && <ErrorBox message={error} />}
            <div className="bg-[#fbfaf7] border border-[#d9d4cb] overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#777269] bg-[#f3f0ea]"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Alert at</th><th className="px-4 py-3"></th></tr></thead>
                    <tbody>{items.map(i => <StockRow key={`${i._id}-${i.stock}-${i.lowStockThreshold}`} item={i} onSaved={u => setItems(list => list.map(x => x._id === u._id ? u : x))} />)}</tbody>
                </table>
                {!loading && items.length === 0 && !error && <div className="p-12 text-center text-sm text-[#777269]">{filter === "all" ? "No products yet." : "Nothing here. Your stock is fine."}</div>}
            </div>
        </section>
    );
};

export default VendorInventory;