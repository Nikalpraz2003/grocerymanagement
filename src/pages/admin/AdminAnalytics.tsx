import { useEffect, useState } from "react";
import { adminError, adminGet } from "../../services/adminApi";
import { ErrorBox, PageHeader, rs } from "../../components/admin/ui";

// ---------- Types (match GET /api/admin/analytics) ----------
interface SalesPoint { date: string; orders: number; revenue: number }
interface NameValue { name: string; value: number; count: number }
interface Analytics {
    days: number; revenue: number; orders: number; averageOrderValue: number; newCustomers: number;
    salesByDay: SalesPoint[]; ordersByStatus: NameValue[]; revenueByCategory: NameValue[];
    revenueByPaymentMethod: NameValue[]; topProducts: NameValue[];
}

const ranges = [[7, "7 days"], [30, "30 days"], [90, "90 days"], [365, "1 year"]] as const;
const shortDay = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

// Long ranges are grouped per week so the bars stay readable
const groupWeeks = (points: SalesPoint[]) => points.reduce<SalesPoint[]>((weeks, p, i) => {
    if (i % 7 === 0) weeks.push({ date: p.date, orders: 0, revenue: 0 });
    const w = weeks[weeks.length - 1]; w.orders += p.orders; w.revenue += p.revenue; return weeks;
}, []);

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="bg-[#fbfaf7] p-4">
        <p className="text-xs text-[#777269]">{label}</p>
        <p className="text-2xl font-semibold mt-3 text-[#202b23]">{value}</p>
        {sub && <p className="text-[10px] uppercase tracking-wider text-[#aaa49a] mt-1">{sub}</p>}
    </div>
);

const Heading = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">{children}</h2>
);

// Vertical bars: revenue per day/week, hover shows details
const SalesChart = ({ points, weekly }: { points: SalesPoint[]; weekly: boolean }) => {
    const max = Math.max(1, ...points.map(p => p.revenue));
    const step = Math.max(1, Math.ceil(points.length / 8));
    return (
        <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-5">
            <div className="flex items-end gap-[3px] h-56">
                {points.map(p => (
                    <div key={p.date} className="flex-1 h-full flex flex-col justify-end group relative">
                        <div className="bg-[#e66f43]/80 group-hover:bg-[#e66f43] rounded-t-sm min-h-[2px]" style={{ height: `${(p.revenue / max) * 100}%` }} />
                        <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#202b23] text-white text-[11px] px-2 py-1 whitespace-nowrap z-10">
                            {weekly ? "Week of " : ""}{shortDay(p.date)}: {rs(p.revenue)} · {p.orders} order{p.orders === 1 ? "" : "s"}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-[3px] mt-2">
                {points.map((p, i) => (
                    <span key={p.date} className="flex-1 relative h-4">
                        {i % step === 0 && <span className="absolute left-1/2 -translate-x-1/2 text-[10px] text-[#9a948a] whitespace-nowrap">{shortDay(p.date)}</span>}
                    </span>
                ))}
            </div>
        </div>
    );
};

// Horizontal bars for a breakdown list
const Breakdown = ({ rows, money = true, countLabel }: { rows: NameValue[]; money?: boolean; countLabel: string }) => {
    const total = rows.reduce((s, r) => s + (money ? r.value : r.count), 0) || 1;
    const max = Math.max(1, ...rows.map(r => (money ? r.value : r.count)));
    if (rows.length === 0) return <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-6 text-sm text-[#777269]">No data in this period.</div>;
    return (
        <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-4 space-y-3">
            {rows.map(r => {
                const v = money ? r.value : r.count;
                return (
                    <div key={r.name}>
                        <div className="flex justify-between gap-3 text-sm mb-1">
                            <span className="truncate">{r.name || "(none)"}</span>
                            <span className="font-semibold whitespace-nowrap">{money ? rs(r.value) : r.count} <span className="text-[11px] font-normal text-[#9a948a]">{Math.round((v / total) * 100)}%</span></span>
                        </div>
                        <div className="h-2 bg-[#efebe4]"><div className="h-2 bg-[#202b23]" style={{ width: `${(v / max) * 100}%` }} /></div>
                        <p className="text-[11px] text-[#9a948a] mt-0.5">{r.count} {countLabel}</p>
                    </div>
                );
            })}
        </div>
    );
};

const AdminAnalytics = () => {
    const [days, setDays] = useState(30);
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setData(await adminGet<Analytics>(`/admin/analytics?days=${days}`)); }
        catch (e) { setError(adminError(e, "Unable to load analytics")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [days]);   // eslint-disable-line react-hooks/exhaustive-deps

    const weekly = days > 31;
    const bars = data ? (weekly ? groupWeeks(data.salesByDay) : data.salesByDay) : [];
    const best = data?.salesByDay.reduce<SalesPoint | null>((b, p) => (!b || p.revenue > b.revenue ? p : b), null);

    return (
        <section className="p-4 sm:p-8 max-w-[1400px] mx-auto">
            <PageHeader title="Analytics" subtitle="Cancelled orders are not counted in revenue." loading={loading} onRefresh={() => void load()}>
                <div className="flex border border-[#d9d4cb] bg-[#fbfaf7]">
                    {ranges.map(([d, label]) => (
                        <button key={d} onClick={() => setDays(d)} className={`px-3 py-2 text-sm ${days === d ? "bg-[#202b23] text-white" : "hover:bg-white"}`}>{label}</button>
                    ))}
                </div>
            </PageHeader>
            {error && <ErrorBox message={error} />}

            {data && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#d9d4cb] border border-[#d9d4cb] mb-8">
                        <Stat label="Revenue" value={rs(data.revenue)} sub={`last ${data.days} days`} />
                        <Stat label="Orders" value={String(data.orders)} sub="not cancelled" />
                        <Stat label="Average order" value={rs(data.averageOrderValue)} />
                        <Stat label="New customers" value={String(data.newCustomers)} sub="signed up" />
                        <Stat label="Best day" value={best && best.revenue > 0 ? rs(best.revenue) : "-"} sub={best && best.revenue > 0 ? shortDay(best.date) : undefined} />
                    </div>

                    <div className="mb-8">
                        <Heading>Sales {weekly ? "per week" : "per day"}</Heading>
                        <SalesChart points={bars} weekly={weekly} />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6 mb-8">
                        <div>
                            <Heading>Top products (by quantity)</Heading>
                            <div className="bg-[#fbfaf7] border border-[#d9d4cb]">
                                {data.topProducts.length === 0 ? <p className="p-6 text-sm text-[#777269]">No sales in this period.</p> : data.topProducts.map((p, i) => (
                                    <div key={p.name} className={`flex items-center gap-3 px-4 py-2.5 ${i ? "border-t border-[#e7e2d9]" : ""}`}>
                                        <span className="w-5 text-xs text-[#9a948a]">{i + 1}</span>
                                        <span className="flex-1 truncate text-sm">{p.name}</span>
                                        <span className="text-xs text-[#777269] w-16 text-right">{p.count} sold</span>
                                        <span className="text-sm font-semibold w-24 text-right">{rs(p.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Heading>Revenue by category</Heading>
                            <Breakdown rows={data.revenueByCategory} countLabel="items sold" />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div>
                            <Heading>Revenue by payment method</Heading>
                            <Breakdown rows={data.revenueByPaymentMethod} countLabel="orders" />
                        </div>
                        <div>
                            <Heading>Orders by status</Heading>
                            <Breakdown rows={data.ordersByStatus} money={false} countLabel="orders" />
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

export default AdminAnalytics;