import { Link } from "react-router-dom";
import { Store, ArrowUpRight } from "lucide-react";
import authService from "../../services/authServices";

const BecomeSellerWidget = () => {
    // Sellers and admins don't need the "Become a Seller" button
    const user = authService.getCurrentUser();
    if (user?.isVendor || user?.isAdmin) return null;

    return (
        <div className="fixed bottom-5 right-22 z-50 flex items-center animate-slide-in-up">
            <Link
                to="/become-seller"
                className="group flex items-center gap-2.5 px-4 py-3.5 bg-[#1B3022] hover:bg-[#254431] text-white rounded-full shadow-xl shadow-green-950/25 transition-all duration-300 hover:scale-105 active:scale-95 border border-emerald-600/40"
                title="Open Seller Onboarding Page"
            >
                <div className="relative flex items-center justify-center">
                    <Store className="size-5 text-amber-400 group-hover:rotate-6 transition-transform" />
                    <span className="absolute -top-1 -right-1 size-2 bg-app-orange rounded-full animate-ping" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide hidden xs:inline sm:inline">
                    Become a Seller
                </span>
                <span className="hidden md:inline text-[10px] uppercase font-bold bg-amber-400 text-green-950 px-2 py-0.5 rounded-full">
                    0% Fee
                </span>
                <ArrowUpRight className="size-4 text-emerald-300 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all hidden sm:inline" />
            </Link>
        </div>
    );
};

export default BecomeSellerWidget;