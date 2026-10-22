import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, Boxes, ShoppingBag, Wallet, ArrowLeft, LogOut } from "lucide-react";
import authService from "../../services/authServices";
import { vendorApi, type VendorStore } from "../../services/vendorApi";

const links = [
    ["Dashboard", "/vendor", LayoutDashboard],
    ["Orders", "/vendor/orders", ShoppingBag],
    ["My Products", "/vendor/products", Package],
    ["Inventory", "/vendor/inventory", Boxes],
    ["Earnings", "/vendor/earnings", Wallet],
] as const;

const logout = () => {
    authService.logout();
    window.location.replace("/login");
};

const VendorLayout = () => {
    const user = authService.getCurrentUser();
    const [store, setStore] = useState<VendorStore | null>(null);

    useEffect(() => { vendorApi.store().then(setStore).catch(() => setStore(null)); }, []);

    return (
        <div className="min-h-screen bg-[#f7f8f6] text-zinc-900 flex">
            <aside className="hidden md:flex w-60 shrink-0 bg-[#202b23] text-white flex-col p-4 sticky top-0 h-screen overflow-y-auto">
                <div className="px-3 py-4 mb-2">
                    <p className="text-lg font-semibold leading-tight">{store?.storeName ?? "My store"}</p>
                    <p className="text-xs text-white/60 mt-1">{user?.email}</p>
                    {store && <p className="text-[11px] text-white/45 mt-2">Commission {store.commissionRate}%</p>}
                </div>
                <nav className="space-y-0.5 flex-1">
                    {links.map(([label, path, Icon]) => (
                        <NavLink key={path} to={path} end={path === "/vendor"}
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
                        <p className="font-semibold">{store?.storeName ?? "Seller"}</p>
                        <div className="flex gap-4 text-xs text-white/75"><NavLink to="/">Store</NavLink><button onClick={logout}>Log out</button></div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto mt-3">
                        {links.map(([label, path]) => <NavLink key={path} to={path} end={path === "/vendor"} className={({ isActive }) => `text-xs whitespace-nowrap ${isActive ? "text-white font-semibold" : "text-white/70"}`}>{label}</NavLink>)}
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default VendorLayout;