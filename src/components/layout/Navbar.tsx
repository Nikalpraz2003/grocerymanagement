import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowUpRightIcon, BikeIcon, ChevronDownIcon, SearchIcon, ShoppingCartIcon, HomeIcon, Store } from "lucide-react";
import { UserIcon, XIcon, MenuIcon, PackageIcon } from "lucide-react";
import { MapPinIcon, ShieldIcon, LayoutDashboardIcon } from "lucide-react";
import { LogOutIcon } from "lucide-react";
import authServices from "../../services/authServices";
import { useCart } from "../../context/CartContext";

const getCurrentUser = () => authServices.getCurrentUser();

const Navbar = () => {
    const user = getCurrentUser();
    const location = useLocation();
    const { cartCount } = useCart();
    const [searchQuery, setSearchQuery] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const isLinkActive = (path: string, exact: boolean = false) => {
        if (exact) {
            return location.pathname === path;
        }
        if (path === "/products") {
            return location.pathname.startsWith("/product");
        }
        return location.pathname.startsWith(path);
    };

    const getNavLinkClass = (path: string, exact: boolean = false) => {
        const active = isLinkActive(path, exact);
        return `relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            active
                ? "text-app-orange bg-orange-50 font-semibold ring-1 ring-app-orange/25 shadow-2xs"
                : "text-zinc-600 hover:text-app-orange hover:bg-orange-50/50"
        }`;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    const handleLogout = () => {
        setUserMenuOpen(false);
        authServices.logout();
        window.location.replace("/");
    };

    return (
        <nav className="bg-white sticky top-0 z-50 border-b border-app-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 text-[22px] font-medium shrink-0">
                    <BikeIcon size={24} /> Pasalmandu
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-2 text-sm">
                    <Link to="/" className={getNavLinkClass("/", true)}>
                        Home
                    </Link>
                    <Link to="/products" className={getNavLinkClass("/products")}>
                        Products
                    </Link>
                    <Link to="/deals" className={getNavLinkClass("/deals")}>
                        Deals
                    </Link>
                    {user?.isVendor ? (
                        <Link to="/vendor" className={getNavLinkClass("/vendor")}>
                            Seller Panel
                        </Link>
                    ) : !user?.isAdmin && (
                        <Link to="/become-seller" className={getNavLinkClass("/become-seller")}>
                            Sell
                        </Link>
                    )}
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-sm text-xs sm:text-sm">
                    <div className="relative w-full">
                        <SearchIcon className="absolute left-2.5 top-1/2 translate-y-[-50%] size-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 p-2 bg-orange-50 rounded-full ring ring-app-orange/15 focus:ring-app-orange/30"
                        />
                    </div>
                </form>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* Cart */}
                    <Link to="/cart" className="relative p-2 rounded-xl hover:bg-orange-50 transition-colors">
                        <ShoppingCartIcon className="size-5 text-zinc-900" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 size-4 bg-app-orange text-white text-[10px] rounded-full flex-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* User Menu */}
                    <div className="relative">
                        {user ? (
                            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-2">
                                <div className="size-5 rounded-full bg-green-950 text-white flex-center">
                               {(user.name || user.email || "U").charAt(0).toUpperCase()}                                </div>
                                <ChevronDownIcon className="size-3 text-zinc-500" />
                            </button>
                        ) : (
                            <div className="flex-center gap-2">
                                <Link
                                    to="/login"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-950 rounded-full hover:bg-green-900 transition"
                                >
                                    <UserIcon size={16} /> Login
                                </Link>
                                {userMenuOpen ? (
                                    <XIcon className="md:hidden" onClick={() => setUserMenuOpen(!userMenuOpen)} />
                                ) : (
                                    <MenuIcon className="md:hidden" onClick={() => setUserMenuOpen(!userMenuOpen)} />
                                )}
                            </div>
                        )}

                        {userMenuOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        )}

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-app-border py-2 z-50 animate-fade-in">
                                {user && (
                                    <div className="px-4 py-2 border-b border-app-border">
                                    <p className="text-sm font-medium text-zinc-900">{user.name || user.email}</p>                                        <p className="text-xs text-zinc-500">{user.email}</p>
                                    </div>
                                )}
                                <div onClick={() => setUserMenuOpen(false)}>
                                    {!user && (
                                        <Link to="/login" className="dropdown-link">
                                            <UserIcon size={16} /> Login
                                        </Link>
                                    )}

                                    {user && (
                                        <Link to="/profile" className="dropdown-link">
                                            <UserIcon size={16} /> My Profile
                                        </Link>
                                    )}

                                    {user && (
                                        <Link to="/orders" className="dropdown-link">
                                            <PackageIcon size={16} /> My Orders
                                        </Link>
                                    )}

                                    {user && (
                                        <Link to="/addresses" className="dropdown-link">
                                            <MapPinIcon size={16} /> My Addresses
                                        </Link>
                                    )}

                                    <Link
                                        to="/"
                                        className={`dropdown-link md:hidden ${isLinkActive("/", true) ? "text-app-orange bg-orange-50 font-semibold" : ""}`}
                                    >
                                        <HomeIcon size={16} /> Home
                                    </Link>

                                    <Link
                                        to="/products"
                                        className={`dropdown-link md:hidden ${isLinkActive("/products") ? "text-app-orange bg-orange-50 font-semibold" : ""}`}
                                    >
                                        <ArrowUpRightIcon size={16} /> Products
                                    </Link>

                                    <Link
                                        to="/deals"
                                        className={`dropdown-link md:hidden ${isLinkActive("/deals") ? "text-app-orange bg-orange-50 font-semibold" : ""}`}
                                    >
                                        <ArrowUpRightIcon size={16} /> Deals
                                    </Link>

                                    {!user?.isVendor && !user?.isAdmin && (
                                    <Link
                                        to="/become-seller"
                                        className={`dropdown-link md:hidden ${
                                            isLinkActive("/become-seller") ? "text-app-orange bg-orange-50 font-semibold" : ""
                                        }`}
                                    >
                                        <Store size={16} /> Become a Seller
                                    </Link>
                                )}

                                    {user?.isAdmin && (
                                        <Link to="/admin" className="dropdown-link">
                                            <ShieldIcon className="text-app-orange-dark" size={16} />
                                            <span className="text-app-orange-dark">Admin Panel</span>
                                        </Link>
                                    )}
                                    
                                    {user?.isVendor && (
                                        <Link to="/vendor" className="dropdown-link">
                                            <LayoutDashboardIcon className="text-app-orange-dark" size={16} />
                                            <span className="text-app-orange-dark">Seller Panel</span>
                                        </Link>
                                    )}

                                    {user && (
                                        <div className="border-t border-app-border pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-app-error hover:bg-red-50 w-full transition-colors"
                                            >
                                                <LogOutIcon size={16} /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;