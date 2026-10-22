import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { adminError, adminGet } from "../../services/adminApi";
import { ErrorBox, PageHeader, Table, Td, btnDark, rs } from "../../components/admin/ui";

// ---------- Type (matches GET /api/admin/commission) ----------
interface CommissionRow {
    vendorId: string; storeName: string; ownerName: string; commissionRate: number; ordersCount: number;
    itemsSold: number; grossSales: number; platformCommission: number; vendorEarnings: number;
}

const ranges = [[7, "7 days"], [30, "30 days"], [90, "90 days"], [365, "1 year"]] as const;

// Builds a CSV file in the browser and downloads it (opens in Excel)
const downloadCsv = (rows: CommissionRow[], days: number) => {
    const header = ["Store", "Owner", "Commission %", "Orders", "Items sold", "Gross sales (Rs.)", "Pasalmandu commission (Rs.)", "Seller earnings (Rs.)"];
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = rows.map(r => [r.storeName, r.ownerName, r.commissionRate, r.ordersCount, r.itemsSold, r.grossSales.toFixed(2), r.platformCommission.toFixed(2), r.vendorEarnings.toFixed(2)].map(cell).join(","));
    const sum = (k: keyof CommissionRow) => rows.reduce((s, r) => s + Number(r[k]), 0);
    lines.push(["TOTAL", "", "", sum("ordersCount"), sum("itemsSold"), sum("grossSales").toFixed(2), sum("platformCommission").toFixed(2), sum("vendorEarnings").toFixed(2)].map(cell).join(","));

    // \uFEFF makes Excel read the file as UTF-8
    const blob = new Blob(["\uFEFF" + [header.map(cell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pasalmandu-commission-last-${days}-days-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

const AdminCommission = () => {
    const [days, setDays] = useState(30);
    const [rows, setRows] = useState<CommissionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setRows(await adminGet<CommissionRow[]>(`/admin/commission?days=${days}`)); }
        catch (e) { setError(adminError(e, "Unable to load commission")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [days]);   // eslint-disable-line react-hooks/exhaustive-deps

    const gross = rows.reduce((s, r) => s + r.grossSales, 0);
    const commission = rows.reduce((s, r) => s + r.platformCommission, 0);
    const earnings = rows.reduce((s, r) => s + r.vendorEarnings, 0);

    return (
        <section className="p-4 sm:p-8 max-w-[1400px] mx-auto">
            <PageHeader title="Commission" subtitle="Sales of seller products from delivered orders." loading={loading} onRefresh={() => void load()}>
                <div className="flex border border-[#d9d4cb] bg-[#fbfaf7]">
                    {ranges.map(([d, label]) => (
                        <button key={d} onClick={() => setDays(d)} className={`px-3 py-2 text-sm ${days === d ? "bg-[#202b23] text-white" : "hover:bg-white"}`}>{label}</button>
                    ))}
                </div>
                <button onClick={() => downloadCsv(rows, days)} disabled={rows.length === 0} className={btnDark}><Download size={16} /> Download CSV</button>
            </PageHeader>
            {error && <ErrorBox message={error} />}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#d9d4cb] border border-[#d9d4cb] mb-6">
                <div className="bg-[#fbfaf7] p-4"><p className="text-xs text-[#777269]">Seller gross sales</p><p className="text-2xl font-semibold mt-3">{rs(gross)}</p></div>
                <div className="bg-[#fbfaf7] p-4"><p className="text-xs text-[#777269]">Pasalmandu commission</p><p className="text-2xl font-semibold mt-3 text-[#e66f43]">{rs(commission)}</p></div>
                <div className="bg-[#fbfaf7] p-4"><p className="text-xs text-[#777269]">Owed to sellers</p><p className="text-2xl font-semibold mt-3">{rs(earnings)}</p></div>
            </div>

            <Table head={["Store", "Rate", "Orders", "Items", "Gross sales", "Commission", "Seller earns"]} empty={rows.length === 0} loading={loading}>
                {rows.map(r => (
                    <tr key={r.vendorId} className="border-t border-[#e7e2d9]">
                        <Td><p className="font-medium">{r.storeName}</p><p className="text-[11px] text-[#9a948a]">{r.ownerName}</p></Td>
                        <Td>{r.commissionRate}%</Td>
                        <Td>{r.ordersCount}</Td>
                        <Td>{r.itemsSold}</Td>
                        <Td>{rs(r.grossSales)}</Td>
                        <Td className="text-[#e66f43] font-semibold">{rs(r.platformCommission)}</Td>
                        <Td className="font-semibold">{rs(r.vendorEarnings)}</Td>
                    </tr>
                ))}
                {rows.length > 0 && (
                    <tr className="border-t-2 border-[#d9d4cb] bg-[#f3f0ea] font-semibold">
                        <Td>Total</Td><Td>{""}</Td>
                        <Td>{rows.reduce((s, r) => s + r.ordersCount, 0)}</Td>
                        <Td>{rows.reduce((s, r) => s + r.itemsSold, 0)}</Td>
                        <Td>{rs(gross)}</Td><Td className="text-[#e66f43]">{rs(commission)}</Td><Td>{rs(earnings)}</Td>
                    </tr>
                )}
            </Table>
            <p className="text-xs text-[#9a948a] mt-3">Change a seller's rate on the Vendors page. Approved sellers with no sales still appear with Rs. 0.</p>
        </section>
    );
};

export default AdminCommission;