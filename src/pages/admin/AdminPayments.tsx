import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi, adminError, type Payment } from "../../services/adminApi";
import { Badge, ErrorBox, PageHeader, Table, Tabs, Td, btnLight, dateTime, rs } from "../../components/admin/ui";

const paidTabs = [["all", "All"], ["unpaid", "Unpaid"], ["paid", "Paid"]] as const;
const methods = [["all", "All methods"], ["cod", "Cash on Delivery"], ["esewa", "eSewa"], ["khalti", "Khalti"], ["card", "Card"]] as const;

const AdminPayments = () => {
    const [rows, setRows] = useState<Payment[]>([]);
    const [paid, setPaid] = useState("all");
    const [method, setMethod] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setRows(await adminApi.payments(paid === "all" ? undefined : paid === "paid", method)); }
        catch (e) { setError(adminError(e, "Unable to load payments")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [paid, method]);   // eslint-disable-line react-hooks/exhaustive-deps

    const markPaid = async (p: Payment) => {
        if (!confirm(`Mark ${p.orderNumber} (${rs(p.amount)}) as paid?`)) return;
        try { const r = await adminApi.markPaid(p.orderNumber); toast.success(r.message); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };

    const total = rows.reduce((s, r) => s + r.amount, 0);
    const received = rows.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0);

    return (
        <section className="p-4 sm:p-8 max-w-[1400px] mx-auto">
            <PageHeader title="Payments" subtitle={`${rows.length} payments · ${rs(received)} received of ${rs(total)}`} loading={loading} onRefresh={() => void load()}>
                <select value={method} onChange={e => setMethod(e.target.value)} className="px-3 py-2 text-sm border border-[#d9d4cb] bg-[#fbfaf7]">
                    {methods.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
            </PageHeader>
            <Tabs value={paid} onChange={setPaid} options={paidTabs} />
            {error && <ErrorBox message={error} />}
            <Table head={["Order", "Customer", "Method", "Amount", "Payment", "Order status", ""]} empty={rows.length === 0} loading={loading}>
                {rows.map(p => (
                    <tr key={p.orderNumber} className="border-t border-[#e7e2d9]">
                        <Td><p className="font-medium">{p.orderNumber}</p><p className="text-[11px] text-[#9a948a]">{dateTime(p.createdAt)}</p></Td>
                        <Td><p>{p.customerName}</p><p className="text-[11px] text-[#9a948a]">{p.customerEmail}</p></Td>
                        <Td className="text-xs">{p.paymentMethodName}</Td>
                        <Td className="font-semibold">{rs(p.amount)}</Td>
                        <Td><Badge label={p.isPaid ? "Paid" : "Unpaid"} />{p.paidAt && <p className="text-[11px] text-[#9a948a] mt-0.5">{dateTime(p.paidAt)}</p>}</Td>
                        <Td><Badge label={p.orderStatus} /></Td>
                        <Td>{!p.isPaid && p.orderStatus !== "Cancelled" && <button onClick={() => void markPaid(p)} className={btnLight}>Mark paid</button>}</Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
};

export default AdminPayments;