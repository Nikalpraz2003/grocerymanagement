
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import {
    ArrowUpRightIcon,
    BikeIcon,
    ChevronDownIcon,
    SearchIcon,
    ShoppingCartIcon,
    HomeIcon,
    Store,
    UserIcon,
    XIcon,
    MenuIcon,
    PackageIcon,
    MapPinIcon,
    ShieldIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    FileCheck,
} from "lucide-react";

import authServices, { type AppUser } from "../../services/authServices";
import { useCart } from "../../context/CartContext";

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Convert relative avatar paths into full URLs
const getAvatarUrl = (avatar?: string | null): string => {
    if (!avatar) return "";

    if (/^https?:\/\//i.test(avatar)) {
        return avatar;
    }

    return `${API_BASE_URL}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

const Navbar = () => {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(
        () => authServices.getCurrentUser()
    );

    const user = currentUser;

    const [searchQuery, setSearchQuery] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const { cartCount } = useCart();

    // Listen for profile and authentication updates
    useEffect(() => {
        const handleUserUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<AppUser | null>;

            setCurrentUser(
                customEvent.detail ?? authServices.getCurrentUser()
            );
        };

        // Changes from another browser tab
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "user" || event.key === null) {
                setCurrentUser(authServices.getCurrentUser());
            }
        };

        window.addEventListener(
            "pasalmandu:user-updated",
            handleUserUpdated
        );

        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener(
                "pasalmandu:user-updated",
                handleUserUpdated
            );

            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    // Reset image error when avatar changes
    useEffect(() => {
        setAvatarLoadFailed(false);
    }, [user?.avatar]);

    // Check active navigation link
    const isLinkActive = (
        path: string,
        exact: boolean = false
    ) => {
        if (exact) {
            return location.pathname === path;
        }

        if (path === "/products") {
            return location.pathname.startsWith("/product");
        }

        return location.pathname.startsWith(path);
    };

    // Navigation link styling
    const getNavLinkClass = (
        path: string,
        exact: boolean = false
    ) => {
        const active = isLinkActive(path, exact);

        return `relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            active
                ? "text-app-orange bg-orange-50 font-semibold ring-1 ring-app-orange/25 shadow-2xs"
                : "text-zinc-600 hover:text-app-orange hover:bg-orange-50/50"
        }`;
    };

    // Search products
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    // Logout
    const handleLogout = () => {
        setUserMenuOpen(false);
        authServices.logout();
        window.location.replace("/");
    };

    return (
        <nav className="bg-white sticky top-0 z-50 border-b border-app-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">

                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-2 text-[22px] font-medium shrink-0"
                >
                    <BikeIcon size={24} />
                    Pasalmandu
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-2 text-sm">
                    <Link
                        to="/"
                        className={getNavLinkClass("/", true)}
                    >
                        Home
                    </Link>

                    <Link
                        to="/products"
                        className={getNavLinkClass("/products")}
                    >
                        Products
                    </Link>

                    <Link
                        to="/deals"
                        className={getNavLinkClass("/deals")}
                    >
                        Deals
                    </Link>

                    {user?.isVendor ? (
                        <Link
                            to="/vendor"
                            className={getNavLinkClass("/vendor")}
                        >
                            Seller Panel
                        </Link>
                    ) : !user?.isAdmin ? (
                        <Link
                            to="/become-seller"
                            className={getNavLinkClass("/become-seller")}
                        >
                            Sell
                        </Link>
                    ) : null}
                </div>

                {/* Search Bar */}
                <form
                    onSubmit={handleSearch}
                    className="hidden sm:flex flex-1 max-w-sm text-xs sm:text-sm"
                >
                    <div className="relative w-full">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />

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
                    <Link
                        to="/cart"
                        className="relative p-2 rounded-xl hover:bg-orange-50 transition-colors"
                    >
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
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 p-2"
                                aria-label="Open user menu"
                            >
                                {/* Profile Avatar */}
                                <div className="size-6 shrink-0 overflow-hidden rounded-full bg-green-950 text-white flex-center">
                                    {user.avatar && !avatarLoadFailed ? (
                                        <img
                                            key={user.avatar}
                                            src={getAvatarUrl(user.avatar)}
                                            alt={user.name || "User"}
                                            className="h-full w-full rounded-full object-cover"
                                            onError={() => setAvatarLoadFailed(true)}
                                        />
                                    ) : (
                                        <span className="text-xs font-semibold">
                                            {(user.name || user.email || "U")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <ChevronDownIcon className="size-3 text-zinc-500" />
                            </button>
                        ) : (
                            <div className="flex-center gap-2">
                                <Link
                                    to="/login"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-950 rounded-full hover:bg-green-900 transition"
                                >
                                    <UserIcon size={16} />
                                    Login
                                </Link>

                                {userMenuOpen ? (
                                    <XIcon
                                        className="md:hidden cursor-pointer"
                                        onClick={() => setUserMenuOpen(false)}
                                    />
                                ) : (
                                    <MenuIcon
                                        className="md:hidden cursor-pointer"
                                        onClick={() => setUserMenuOpen(true)}
                                    />
                                )}
                            </div>
                        )}

                        {/* Close menu overlay */}
                        {userMenuOpen && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setUserMenuOpen(false)}
                            />
                        )}

                        {/* Dropdown Menu */}
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-app-border py-2 z-50 animate-fade-in">

                                {user && (
                                    <div className="px-4 py-2 border-b border-app-border">
                                        <p className="text-sm font-medium text-zinc-900">
                                            {user.name || user.email}
                                        </p>

                                        <p className="text-xs text-zinc-500">
                                            {user.email}
                                        </p>
                                    </div>
                                )}

                                <div onClick={() => setUserMenuOpen(false)}>

                                    {!user && (
                                        <Link
                                            to="/login"
                                            className="dropdown-link"
                                        >
                                            <UserIcon size={16} />
                                            Login
                                        </Link>
                                    )}

                                    {user && (
                                        <Link
                                            to="/profile"
                                            className="dropdown-link"
                                        >
                                            <UserIcon size={16} />
                                            My Profile
                                        </Link>
                                    )}

                                    {user && (
                                        <Link
                                            to="/orders"
                                            className="dropdown-link"
                                        >
                                            <PackageIcon size={16} />
                                            My Orders
                                        </Link>
                                    )}

                                    {user && (
                                        <Link
                                            to="/addresses"
                                            className="dropdown-link"
                                        >
                                            <MapPinIcon size={16} />
                                            My Addresses
                                        </Link>
                                    )}

                                    {/* My Seller Application - applicants and customers only */}
                                    {user && !user.isVendor && !user.isAdmin && (
                                        <Link
                                            to="/my-seller-application"
                                            className={`dropdown-link ${
                                                isLinkActive("/my-seller-application")
                                                    ? "text-app-orange bg-orange-50 font-semibold"
                                                    : ""
                                            }`}
                                        >
                                            <FileCheck size={16} />
                                            My Seller Application
                                        </Link>
                                    )}

                                    {/* Mobile Navigation */}
                                    <Link
                                        to="/"
                                        className={`dropdown-link md:hidden ${
                                            isLinkActive("/", true)
                                                ? "text-app-orange bg-orange-50 font-semibold"
                                                : ""
                                        }`}
                                    >
                                        <HomeIcon size={16} />
                                        Home
                                    </Link>

                                    <Link
                                        to="/products"
                                        className={`dropdown-link md:hidden ${
                                            isLinkActive("/products")
                                                ? "text-app-orange bg-orange-50 font-semibold"
                                                : ""
                                        }`}
                                    >
                                        <ArrowUpRightIcon size={16} />
                                        Products
                                    </Link>

                                    <Link
                                        to="/deals"
                                        className={`dropdown-link md:hidden ${
                                            isLinkActive("/deals")
                                                ? "text-app-orange bg-orange-50 font-semibold"
                                                : ""
                                        }`}
                                    >
                                        <ArrowUpRightIcon size={16} />
                                        Deals
                                    </Link>

                                    {!user?.isVendor && !user?.isAdmin && (
                                        <Link
                                            to="/become-seller"
                                            className={`dropdown-link md:hidden ${
                                                isLinkActive("/become-seller")
                                                    ? "text-app-orange bg-orange-50 font-semibold"
                                                    : ""
                                            }`}
                                        >
                                            <Store size={16} />
                                            Become a Seller
                                        </Link>
                                    )}

                                    {/* Admin Panel */}
                                    {user?.isAdmin && (
                                        <Link
                                            to="/admin"
                                            className="dropdown-link"
                                        >
                                            <ShieldIcon
                                                className="text-app-orange-dark"
                                                size={16}
                                            />
                                            <span className="text-app-orange-dark">
                                                Admin Panel
                                            </span>
                                        </Link>
                                    )}

                                    {/* Vendor Panel */}
                                    {user?.isVendor && (
                                        <Link
                                            to="/vendor"
                                            className="dropdown-link"
                                        >
                                            <LayoutDashboardIcon
                                                className="text-app-orange-dark"
                                                size={16}
                                            />
                                            <span className="text-app-orange-dark">
                                                Seller Panel
                                            </span>
                                        </Link>
                                    )}

                                    {/* Logout */}
                                    {user && (
                                        <div className="border-t border-app-border pt-1">
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-app-error hover:bg-red-50 w-full transition-colors"
                                            >
                                                <LogOutIcon size={16} />
                                                Logout
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
