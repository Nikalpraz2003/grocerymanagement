import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi, adminError, type InventoryItem } from "../../services/adminApi";
import { Badge, ErrorBox, PageHeader, Table, Tabs, Td } from "../../components/admin/ui";

const filters = [["all", "All"], ["low", "Low stock"], ["out", "Out of stock"]] as const;

// One row with its own editable stock boxes
const StockRow = ({ item, onSaved }: { item: InventoryItem; onSaved: (i: InventoryItem) => void }) => {
    const [stock, setStock] = useState(String(item.stock));
    const [alertAt, setAlertAt] = useState(String(item.lowStockThreshold));
    const [saving, setSaving] = useState(false);
    const changed = Number(stock) !== item.stock || Number(alertAt) !== item.lowStockThreshold;

    const save = async () => {
        if (Number(stock) < 0 || Number.isNaN(Number(stock))) { toast.error("Stock must be 0 or more"); return; }
        setSaving(true);
        try { onSaved(await adminApi.updateStock(item._id, Number(stock), Number(alertAt))); toast.success(`${item.name} updated`); }
        catch (e) { toast.error(adminError(e)); }
        finally { setSaving(false); }
    };
    const box = "w-24 px-2 py-1.5 border border-[#d9d4cb] bg-white text-sm outline-none focus:border-[#e66f43]";

    return (
        <tr className="border-t border-[#e7e2d9]">
            <Td><div className="flex items-center gap-3"><img src={item.image} alt="" className="size-10 object-cover bg-[#f0ece4]" /><div><p className="font-semibold text-xs">{item.name}</p><p className="text-[11px] text-[#9a948a]">{item.category} · {item.unit}</p></div></div></Td>
            <Td><Badge label={item.stockStatus} />{!item.isActive && <span className="ml-1"><Badge label="Hidden" /></span>}</Td>
            <Td><input type="number" min={0} value={stock} onChange={e => setStock(e.target.value)} onKeyDown={e => e.key === "Enter" && changed && void save()} className={box} /></Td>
            <Td><input type="number" min={0} value={alertAt} onChange={e => setAlertAt(e.target.value)} className={box} /></Td>
            <Td className="text-right"><button onClick={() => void save()} disabled={!changed || saving} className="px-3 py-1.5 text-xs font-semibold bg-[#202b23] text-white disabled:opacity-30">{saving ? "Saving" : "Save"}</button></Td>
        </tr>
    );
};

const AdminInventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setItems(await adminApi.inventory(filter)); }
        catch (e) { setError(adminError(e, "Unable to load inventory")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [filter]);   // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <section className="p-4 sm:p-8 max-w-[1200px] mx-auto">
            <PageHeader title="Inventory" subtitle="Change a number and press Save (or Enter)." loading={loading} onRefresh={() => void load()} />
            <Tabs value={filter} onChange={setFilter} options={filters} />
            {error && <ErrorBox message={error} />}
            <Table head={["Product", "Status", "Stock", "Alert at", ""]} empty={items.length === 0} loading={loading}>
                {items.map(i => <StockRow key={`${i._id}-${i.stock}-${i.lowStockThreshold}`} item={i} onSaved={u => setItems(list => list.map(x => x._id === u._id ? u : x))} />)}
            </Table>
        </section>
    );
};

export default AdminInventory;