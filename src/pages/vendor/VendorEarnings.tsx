import { useEffect, useState } from "react";
import { errorMessage, vendorApi, type VendorEarnings as Earnings } from "../../services/vendorApi";
import { ErrorBox, PageHeader, SalesBars, Stat, dateTime, rs } from "./shared";

const ranges = [[7, "7 days"], [30, "30 days"], [90, "90 days"], [365, "1 year"]] as const;

const VendorEarnings = () => {
    const [days, setDays] = useState(30);
    const [data, setData] = useState<Earnings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setData(await vendorApi.earnings(days)); }
        catch (e) { setError(errorMessage(e, "Unable to load earnings")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [days]);   // eslint-disable-line react-hooks/exhaustive-deps

    // Long ranges: show the bars per week so they stay readable
    const bars = !data ? [] : days <= 31 ? data.salesByDay : data.salesByDay.reduce<{ date: string; revenue: number; orders: number }[]>((weeks, p, i) => {
        if (i % 7 === 0) weeks.push({ date: p.date, revenue: 0, orders: 0 });
        const w = weeks[weeks.length - 1]; w.revenue += p.revenue; w.orders += p.orders; return weeks;
    }, []);

    return (
        <section className="p-4 sm:p-8 max-w-[1200px] mx-auto">
            <PageHeader title="Earnings" subtitle="Sales count once an order is delivered." loading={loading} onRefresh={() => void load()}>
                <select value={days} onChange={e => setDays(Number(e.target.value))} className="px-3 py-2 text-sm border border-[#d9d4cb] bg-[#fbfaf7]">
                    {ranges.map(([d, label]) => <option key={d} value={d}>Last {label}</option>)}
                </select>
            </PageHeader>
            {error && <ErrorBox message={error} />}

            {data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#d9d4cb] border border-[#d9d4cb] mb-8">
                        <Stat label="Your earnings" value={rs(data.earnings)} sub="after commission" />
                        <Stat label="Gross sales" value={rs(data.grossSales)} sub={`${data.ordersCount} orders · ${data.itemsSold} items`} />
                        <Stat label="Commission" value={rs(data.commission)} sub={`${data.commissionRate}% to Pasalmandu`} />
                        <Stat label="Pending sales" value={rs(data.pendingSales)} sub="not delivered yet" />
                        <Stat label="Avg. per order" value={rs(data.ordersCount ? data.grossSales / data.ordersCount : 0)} sub="gross" />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">Sales {days <= 31 ? "per day" : "per week"}</h2>
                            <SalesBars points={bars} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">Top products</h2>
                            <div className="bg-[#fbfaf7] border border-[#d9d4cb]">
                                {data.topProducts.length === 0 ? <p className="p-5 text-sm text-[#777269]">No delivered sales yet.</p> : data.topProducts.map((p, i) => (
                                    <div key={p.name} className={`flex items-center justify-between gap-3 px-4 py-3 ${i ? "border-t border-[#e7e2d9]" : ""}`}>
                                        <div className="min-w-0"><p className="text-sm font-medium truncate">{p.name}</p><p className="text-[11px] text-[#9a948a]">{p.count} sold</p></div>
                                        <p className="text-sm font-semibold">{rs(p.value)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">Delivered orders</h2>
                    <div className="bg-[#fbfaf7] border border-[#d9d4cb] overflow-x-auto">
                        {data.orders.length === 0 ? <p className="p-6 text-sm text-[#777269]">No delivered orders in this period.</p> : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-[#777269] bg-[#f3f0ea]"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Delivered</th><th className="px-4 py-3">Items</th><th className="px-4 py-3 text-right">Gross</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3 text-right">You earn</th></tr></thead>
                                <tbody>{data.orders.map(o => (
                                    <tr key={o.orderNumber} className="border-t border-[#e7e2d9]">
                                        <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                                        <td className="px-4 py-3 text-[#777269]">{dateTime(o.date)}</td>
                                        <td className="px-4 py-3">{o.items}</td>
                                        <td className="px-4 py-3 text-right">{rs(o.gross)}</td>
                                        <td className="px-4 py-3 text-right text-[#9a948a]">− {rs(o.commission)}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{rs(o.earnings)}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </section>
    );
};

export default VendorEarnings;