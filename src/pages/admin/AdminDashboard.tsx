import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, BarChart3, Boxes, Package, RefreshCw, ShoppingCart, Store, Users } from "lucide-react";
import { AdminApiError, adminGet } from "../../services/adminApi";

interface RecentOrder { _id: string; orderNumber: string; user?: { name: string; email: string } | null; total: number; status: string; createdAt: string }
interface Dashboard {
    customers: number; vendors: number; pendingVendorApplications: number; products: number;
    orders: number; pendingOrders: number; revenue: number; todayRevenue: number; todayOrders: number;
    lowStock: number; outOfStock: number; recentOrders: RecentOrder[];
}

const modules = [["Customers", "/admin/customers", Users], ["Vendors", "/admin/vendors", Store], ["Products", "/admin/products", Package], ["Inventory", "/admin/inventory", Boxes], ["Orders", "/admin/orders", ShoppingCart], ["Analytics", "/admin/analytics", BarChart3]] as const;

const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning." : h < 17 ? "Good afternoon." : "Good evening."; };

const AdminDashboard = () => {
    const [data, setData] = useState<Dashboard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true); setError(null);
        try { const d = await adminGet<Dashboard>("/admin/dashboard"); setData({ ...d, recentOrders: d?.recentOrders ?? [] }); }
        catch (e) { setError(e instanceof AdminApiError ? e.message : "Unable to load the dashboard"); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, []);

    const stats: [string, string, string][] = data ? [
        ["Customers", String(data.customers ?? 0), "registered"],
        ["Vendors", String(data.vendors), `${data.pendingVendorApplications} pending applications`],
        ["Products", String(data.products), "in catalog"],
        ["Orders", String(data.orders), `${data.pendingOrders} pending · ${data.todayOrders} today`],
        ["Revenue", rs(data.revenue ?? 0), `${rs(data.todayRevenue ?? 0)} today`],
        ["Low stock", String(data.lowStock), `${data.outOfStock} out of stock`],
    ] : ["Customers", "Vendors", "Products", "Orders", "Revenue", "Low stock"].map(l => [l, "--", loading ? "Loading" : "Not connected"]);

    return (
        <section className="p-4 sm:p-8 max-w-[1500px] mx-auto">
            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e66f43] mb-2">Admin workspace</p>
                    <h1 className="text-3xl sm:text-4xl font-serif text-[#202b23]">{greeting()}</h1>
                    <p className="text-sm text-[#777269] mt-2">Manage your grocery marketplace.</p>
                </div>
                <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#d9d4cb] bg-[#fbfaf7] hover:border-[#e66f43]"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </div>

            {error && (
                <div className="border-l-2 border-[#e66f43] bg-[#fbf3e9] p-4 flex gap-3 items-start mb-8">
                    <AlertCircle className="size-5 text-app-orange shrink-0" />
                    <div><h2 className="font-semibold">Could not load dashboard</h2><p className="text-sm text-[#706b62] mt-1">{error}</p></div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px bg-[#d9d4cb] border border-[#d9d4cb] mb-8">
                {stats.map(([label, value, sub]) => (
                    <div key={label} className="bg-[#fbfaf7] p-4">
                        <p className="text-xs text-[#777269]">{label}</p>
                        <p className={`text-2xl font-semibold mt-3 ${data ? "text-[#202b23]" : "text-[#b4aea4]"}`}>{value}</p>
                        <p className="text-[10px] uppercase tracking-wider text-[#aaa49a] mt-1">{sub}</p>
                    </div>
                ))}
            </div>

            {data && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61]">Recent orders</h2>
                        <Link to="/admin/orders" className="text-xs text-[#e66f43]">View all</Link>
                    </div>
                    <div className="bg-[#fbfaf7] border border-[#d9d4cb] overflow-x-auto">
                        {data.recentOrders.length === 0 ? <p className="p-6 text-sm text-[#777269]">No orders yet.</p> : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-[#777269]"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead>
                                <tbody>{data.recentOrders.map(o => (
                                    <tr key={o._id} className="border-t border-[#e7e2d9]">
                                        <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                                        <td className="px-4 py-3">{o.user?.name ?? "-"}</td>
                                        <td className="px-4 py-3">{rs(o.total)}</td>
                                        <td className="px-4 py-3">{o.status}</td>
                                        <td className="px-4 py-3 text-[#777269]">{new Date(o.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f6a61] mb-3">Work areas</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {modules.map(([label, path, Icon]) => (
                    <Link key={path} to={path} className="group bg-[#fbfaf7] border border-[#d9d4cb] p-5 hover:border-[#e66f43] transition">
                        <div className="flex items-center justify-between"><div className="size-9 text-[#e66f43] flex items-center justify-center border border-[#ead5c8]"><Icon size={18} /></div><ArrowRight size={16} className="text-[#aaa49a] group-hover:text-[#e66f43]" /></div>
                        <h2 className="font-semibold mt-5">{label}</h2>
                        <p className="text-xs text-[#858078] mt-1">Manage {label.toLowerCase()} and activity</p>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default AdminDashboard;