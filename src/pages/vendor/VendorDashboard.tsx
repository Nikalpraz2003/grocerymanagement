import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { errorMessage, vendorApi, type VendorDashboard as Dashboard } from "../../services/vendorApi";
import { Badge, ErrorBox, PageHeader, SalesBars, Stat, dateTime, rs } from "./shared";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

const VendorDashboard = () => {
    const [data, setData] = useState<Dashboard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true); setError(null);
        try { setData(await vendorApi.dashboard()); }
        catch (e) { setError(errorMessage(e, "Unable to load the dashboard")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, []);

    return (
        <section className="p-4 sm:p-8 max-w-[1400px] mx-auto">
            <PageHeader title={`${greeting()}${data ? `, ${data.store.ownerName.split(" ")[0]}` : ""}.`} subtitle={data?.store.storeName ?? "Your store at a glance."} loading={loading} onRefresh={() => void load()} />
            {error && <ErrorBox message={error} />}

            {data && (
                <>
                    {data.ordersToPack > 0 && (
                        <Link to="/vendor/orders" className="flex items-center justify-between gap-4 border-l-2 border-[#e66f43] bg-[#fbf3e9] p-4 mb-6 hover:bg-[#f8ead9]">
                            <p className="text-sm"><span className="font-semibold">{data.ordersToPack} order{data.ordersToPack === 1 ? "" : "s"}</span> waiting for you to pack.</p>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#e66f43]">Pack now <ArrowRight size={15} /></span>
                        </Link>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px bg-[#d9d4cb] border border-[#d9d4cb] mb-8">
                        <Stat label="Earnings" value={rs(data.earnings)} sub={`after ${data.store.commissionRate}% commission`} />
                        <Stat label="Gross sales" value={rs(data.grossSales)} sub="delivered orders" />
                        <Stat label="Pending sales" value={rs(data.pendingSales)} sub="not delivered yet" />
                        <Stat label="Orders" value={String(data.totalOrders)} sub={`${data.todayOrders} today`} />
                        <Stat label="Products" value={String(data.products)} sub={`${data.activeProducts} active`} />
                        <Stat label="Low stock" value={String(data.lowStock)} sub={`${data.outOfStock} out of stock`} />
                    </div>

                    <div className="grid lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">Sales, last 7 days</h2>
                            <SalesBars points={data.salesLast7Days} />
                        </div>
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61]">Recent orders</h2>
                                <Link to="/vendor/orders" className="text-xs text-[#e66f43]">View all</Link>
                            </div>
                            <div className="bg-[#fbfaf7] border border-[#d9d4cb] overflow-x-auto">
                                {data.recentOrders.length === 0 ? (
                                    <p className="p-6 text-sm text-[#777269]">No orders yet. Orders appear here when customers buy your products.</p>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-[#777269]"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Your total</th><th className="px-4 py-3">Packing</th><th className="px-4 py-3">Order status</th></tr></thead>
                                        <tbody>{data.recentOrders.map(o => (
                                            <tr key={o._id} className="border-t border-[#e7e2d9]">
                                                <td className="px-4 py-3"><p className="font-medium">{o.orderNumber}</p><p className="text-xs text-[#9a948a]">{dateTime(o.createdAt)}</p></td>
                                                <td className="px-4 py-3">{o.itemCount}</td>
                                                <td className="px-4 py-3">{rs(o.itemsTotal)}</td>
                                                <td className="px-4 py-3"><Badge label={o.packStatus} /></td>
                                                <td className="px-4 py-3"><Badge label={o.orderStatus} /></td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {data.products === 0 && (
                        <div className="mt-8 bg-[#fbfaf7] border border-[#d9d4cb] p-8 text-center">
                            <h2 className="font-semibold">Add your first product</h2>
                            <p className="text-sm text-[#777269] mt-1">Customers will see it in the shop as soon as it's active.</p>
                            <Link to="/vendor/products" className="inline-block mt-4 px-4 py-2.5 bg-[#202b23] text-white text-sm font-semibold hover:bg-[#314237]">Add product</Link>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default VendorDashboard;