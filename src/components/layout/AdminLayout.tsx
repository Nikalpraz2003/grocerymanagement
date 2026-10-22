import { NavLink, Outlet } from "react-router-dom";
import {
    LayoutDashboard, Package, ShoppingCart, Users, Store, BarChart3, Settings, ArrowLeft, LogOut,
    Tags, Boxes, CreditCard, Bike, Percent, Ticket, MessageSquare,
} from "lucide-react";
import authService from "../../services/authServices";

const links = [
    ["Dashboard", "/admin", LayoutDashboard],
    ["Products", "/admin/products", Package],
    ["Categories", "/admin/categories", Tags],
    ["Inventory", "/admin/inventory", Boxes],
    ["Orders", "/admin/orders", ShoppingCart],
    ["Payments", "/admin/payments", CreditCard],
    ["Delivery", "/admin/delivery", Bike],
    ["Customers", "/admin/customers", Users],
    ["Vendors", "/admin/vendors", Store],
    ["Commission", "/admin/commission", Percent],
    ["Coupons", "/admin/coupons", Ticket],
    ["Reviews", "/admin/reviews", MessageSquare],
    ["Analytics", "/admin/analytics", BarChart3],
    ["Settings", "/admin/settings", Settings],
] as const;

const logout = () => {
    authService.logout();
    window.location.replace("/login");
};

const AdminLayout = () => {
    const user = authService.getCurrentUser();
    return (
        <div className="min-h-screen bg-[#f7f8f6] text-zinc-900 flex">
            <aside className="hidden md:flex w-60 shrink-0 bg-[#202b23] text-white flex-col p-4 sticky top-0 h-screen overflow-y-auto">
                <div className="px-3 py-4 mb-2">
                    <p className="text-lg font-semibold">Pasalmandu</p>
                    <p className="text-xs text-white/60 mt-1">{user?.email ?? "Admin workspace"}</p>
                </div>
                <nav className="space-y-0.5 flex-1">
                    {links.map(([label, path, Icon]) => (
                        <NavLink key={path} to={path} end={path === "/admin"}
                            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 text-sm rounded-lg ${isActive ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
                            <Icon size={17} />{label}
                        </NavLink>
                    ))}
                </nav>
                <NavLink to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-white/65 hover:text-white"><ArrowLeft size={17} />Back to store</NavLink>
                <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-sm text-white/65 hover:text-white text-left"><LogOut size={17} />Log out</button>
            </aside>
            <main className="flex-1 min-w-0">
                <div className="md:hidden bg-[#202b23] text-white px-4 py-4">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">Pasalmandu Admin</p>
                        <div className="flex gap-4 text-xs text-white/75"><NavLink to="/">Store</NavLink><button onClick={logout}>Log out</button></div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto mt-3">
                        {links.map(([label, path]) => <NavLink key={path} to={path} end={path === "/admin"} className={({ isActive }) => `text-xs whitespace-nowrap ${isActive ? "text-white font-semibold" : "text-white/70"}`}>{label}</NavLink>)}
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;