import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { AdminApiError, adminGet } from "../../services/adminApi";

// Loads an admin endpoint and shows whatever it returns:
// - a list  -> a table
// - an object -> its simple values as cards, and each list inside it as a table

type AdminModulePageProps = { title: string; description: string; endpoint: string };
type Row = Record<string, unknown>;

const isPlain = (v: unknown) => v === null || ["string", "number", "boolean"].includes(typeof v);
const label = (key: string) => key.replace(/^_id$/, "id").replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());

const show = (key: string, v: unknown): string => {
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "number") return /amount|total|revenue|price|spent|sales|commission|earnings|fee|value|subtotal/i.test(key) && !/count|percent|rate/i.test(key) ? `Rs. ${v.toLocaleString("en-IN")}` : v.toLocaleString("en-IN");
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString();
    if (typeof v === "object" && v && "name" in v) return String((v as Row).name);
    if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? "" : "s"}`;
    return String(v);
};

const DataTable = ({ rows }: { rows: Row[] }) => {
    if (rows.length === 0) return <p className="p-6 text-sm text-[#777269]">Nothing here yet.</p>;
    const hidden = new Set(["id", "image", "images", "avatar", "nutrition", "description", "highlights", "dietaryTags", "statusHistory", "shippingAddress", "deliveryOtp"]);
    const columns = Object.keys(rows[0]).filter(k => !hidden.has(k)).slice(0, 9);
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#777269] bg-[#f3f0ea]"><tr>{columns.map(c => <th key={c} className="px-4 py-3 whitespace-nowrap">{label(c)}</th>)}</tr></thead>
                <tbody>{rows.map((r, i) => (
                    <tr key={String(r._id ?? r.orderNumber ?? i)} className="border-t border-[#e7e2d9]">
                        {columns.map(c => <td key={c} className="px-4 py-3 whitespace-nowrap max-w-[260px] truncate">{show(c, r[c])}</td>)}
                    </tr>
                ))}</tbody>
            </table>
        </div>
    );
};

const DataView = ({ data }: { data: unknown }) => {
    if (Array.isArray(data)) return <div className="bg-[#fbfaf7] border border-[#d9d4cb]"><p className="px-4 py-3 text-xs text-[#777269] border-b border-[#e7e2d9]">{data.length} record{data.length === 1 ? "" : "s"}</p><DataTable rows={data as Row[]} /></div>;
    if (!data || typeof data !== "object") return <p className="text-sm">{String(data)}</p>;

    const entries = Object.entries(data as Row);
    const simple = entries.filter(([, v]) => isPlain(v));
    const lists = entries.filter(([, v]) => Array.isArray(v));
    const objects = entries.filter(([, v]) => v && typeof v === "object" && !Array.isArray(v));
    return (
        <div className="space-y-6">
            {simple.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-px bg-[#d9d4cb] border border-[#d9d4cb]">
                    {simple.map(([k, v]) => <div key={k} className="bg-[#fbfaf7] p-4"><p className="text-xs text-[#777269]">{label(k)}</p><p className="text-xl font-semibold mt-2 text-[#202b23]">{show(k, v)}</p></div>)}
                </div>
            )}
            {objects.map(([k, v]) => <div key={k}><h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">{label(k)}</h2><DataView data={v} /></div>)}
            {lists.map(([k, v]) => <div key={k}><h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">{label(k)}</h2><DataView data={v} /></div>)}
        </div>
    );
};

const AdminModulePage = ({ title, description, endpoint }: AdminModulePageProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<unknown>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setData(await adminGet<unknown>(endpoint));
        } catch (requestError) {
            setError(requestError instanceof AdminApiError ? requestError.message : "Unable to load this module");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, [endpoint]);   // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <section className="p-4 sm:p-8 max-w-[1500px] mx-auto">
            <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e66f43] mb-2">Workspace</p>
                    <h1 className="text-3xl sm:text-4xl font-serif text-[#202b23]">{title}</h1>
                    <p className="text-sm text-[#777269] mt-2">{description}</p>
                </div>
                <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#d9d4cb] bg-[#fbfaf7] hover:border-[#e66f43]"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </div>
            {error ? (
                <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-8 sm:p-12 text-center">
                    <AlertCircle className="mx-auto size-8 text-app-orange mb-3" />
                    <h2 className="font-semibold text-[#292722]">Could not load {title.toLowerCase()}</h2>
                    <p className="text-sm text-[#777269] mt-2 max-w-lg mx-auto">{error}</p>
                    <p className="text-xs text-[#aaa49a] mt-2">GET /api{endpoint}</p>
                </div>
            ) : loading && data === null ? (
                <p className="text-sm text-[#777269]">Loading {title.toLowerCase()}...</p>
            ) : (
                <DataView data={data} />
            )}
        </section>
    );
};

export default AdminModulePage;