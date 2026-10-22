import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

// Small pieces shared by the vendor pages

export const rs = (n: number) => `Rs. ${Math.round(n ?? 0).toLocaleString("en-IN")}`;
export const shortDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
export const dateTime = (d: string) => new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const PageHeader = ({ title, subtitle, loading, onRefresh, children }: {
    title: string; subtitle?: string; loading?: boolean; onRefresh?: () => void; children?: ReactNode;
}) => (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e66f43] mb-2">Seller workspace</p>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#202b23]">{title}</h1>
            {subtitle && <p className="text-sm text-[#777269] mt-2">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
            {children}
            {onRefresh && (
                <button onClick={onRefresh} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#d9d4cb] bg-[#fbfaf7] hover:border-[#e66f43]">
                    <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            )}
        </div>
    </div>
);

export const ErrorBox = ({ message }: { message: string }) => (
    <div className="border-l-2 border-[#e66f43] bg-[#fbf3e9] p-4 flex gap-3 items-start mb-6">
        <AlertCircle className="size-5 text-app-orange shrink-0" />
        <p className="text-sm text-[#706b62]">{message}</p>
    </div>
);

const tones: Record<string, string> = {
    Ready: "bg-green-50 text-green-800 border-green-200",
    Pending: "bg-amber-50 text-amber-800 border-amber-200",
    Delivered: "bg-green-50 text-green-800 border-green-200",
    Cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200",
    "Out for Delivery": "bg-blue-50 text-blue-800 border-blue-200",
    "In stock": "bg-green-50 text-green-800 border-green-200",
    "Low stock": "bg-amber-50 text-amber-800 border-amber-200",
    "Out of stock": "bg-red-50 text-red-700 border-red-200",
    Hidden: "bg-zinc-100 text-zinc-500 border-zinc-200",
    Active: "bg-green-50 text-green-800 border-green-200",
};

export const Badge = ({ label }: { label: string }) => (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold border rounded-full whitespace-nowrap ${tones[label] ?? "bg-[#f3f0ea] text-[#5f5a52] border-[#e1dbd0]"}`}>{label}</span>
);

export const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="bg-[#fbfaf7] p-4">
        <p className="text-xs text-[#777269]">{label}</p>
        <p className="text-2xl font-semibold mt-3 text-[#202b23]">{value}</p>
        {sub && <p className="text-[10px] uppercase tracking-wider text-[#aaa49a] mt-1">{sub}</p>}
    </div>
);

// Simple bar chart for sales per day
export const SalesBars = ({ points }: { points: { date: string; revenue: number; orders: number }[] }) => {
    const max = Math.max(1, ...points.map(p => p.revenue));
    const step = points.length > 14 ? Math.ceil(points.length / 7) : 1;
    return (
        <div className="bg-[#fbfaf7] border border-[#d9d4cb] p-5">
            <div className="flex items-end gap-1 h-40">
                {points.map(p => (
                    <div key={p.date} className="flex-1 h-full flex flex-col justify-end group relative">
                        <div className="bg-[#e66f43]/80 group-hover:bg-[#e66f43] rounded-t-sm min-h-[2px]" style={{ height: `${(p.revenue / max) * 100}%` }} />
                        <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#202b23] text-white text-[11px] px-2 py-1 whitespace-nowrap z-10">
                            {shortDate(p.date)}: {rs(p.revenue)} · {p.orders} order{p.orders === 1 ? "" : "s"}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-1 mt-2">
                {points.map((p, i) => <span key={p.date} className="flex-1 text-center text-[10px] text-[#9a948a] truncate">{i % step === 0 ? shortDate(p.date) : ""}</span>)}
            </div>
        </div>
    );
};