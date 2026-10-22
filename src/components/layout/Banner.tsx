import { TruckIcon, XIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import { useStoreSettings } from "../../services/shopApi";

const Banner = () => {
    const { settings } = useStoreSettings();   // free-delivery limit from Admin -> Settings
    const [bannerVisible, setBannerVisible] = useState(() => {
        return sessionStorage.getItem("banner_dismissed") !== "true";
    });

    const dismissBanner = () => {
        setBannerVisible(false);
        sessionStorage.setItem("banner_dismissed", "true");
    };

    return (
        <div>
            {bannerVisible && (
                <div className="bg-linear-to-r from-app-green via-emerald-800 to-app-green text-white text-xs sm:text-sm relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex-center gap-6">
                        <div className="flex items-center gap-2">
                            <TruckIcon className="size-5 shrink-0" />
                            <span>Free delivery on orders over Rs {settings.freeDeliveryThreshold}</span>
                        </div>
                        <span className="hidden sm:inline text-white/40"> </span>
                        <div className="hidden sm:flex items-center gap-2">
                            <ZapIcon className="size-4 fill-yellow-400 text-yellow-400 shrink-0" />
                            <span>Fresh product delivered regular </span>
                        </div>
                    </div>
                    <button
                        onClick={dismissBanner}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <XIcon className="size-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Banner;
