import type { ReactNode } from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

// Small building blocks shared by the admin pages

export const rs = (n: number) => `Rs. ${Math.round(n ?? 0).toLocaleString("en-IN")}`;
export const dateTime = (d?: string | null) => d ? new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "-";
export const shortDate = (d?: string | null) => d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-";

export const inputCls = "w-full px-3 py-2.5 bg-white border border-[#d9d4cb] text-sm outline-none focus:border-[#e66f43]";
export const btnDark = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-[#202b23] text-white hover:bg-[#314237] disabled:opacity-50";
export const btnLight = "inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-[#d9d4cb] bg-[#fbfaf7] hover:border-[#e66f43] disabled:opacity-50";
export const btnOrange = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-[#e66f43] text-white hover:bg-[#d65f33] disabled:opacity-50";
export const btnDanger = "inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50";
export const iconBtn = "p-2 border border-[#d9d4cb] hover:border-[#e66f43] disabled:opacity-40";

export const PageHeader = ({ title, subtitle, loading, onRefresh, children }: {
    title: string; subtitle?: string; loading?: boolean; onRefresh?: () => void; children?: ReactNode;
}) => (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e66f43] mb-2">Workspace</p>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#202b23]">{title}</h1>
            {subtitle && <p className="text-sm text-[#777269] mt-2">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
            {children}
            {onRefresh && <button onClick={onRefresh} className={btnLight}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>}
        </div>
    </div>
);

export const ErrorBox = ({ message }: { message: string }) => (
    <div className="border-l-2 border-[#e66f43] bg-[#fbf3e9] p-4 flex gap-3 items-start mb-5">
        <AlertCircle className="size-5 text-app-orange shrink-0" />
        <p className="text-sm text-[#706b62]">{message}</p>
    </div>
);

const tones: Record<string, string> = {
    Placed: "bg-amber-50 text-amber-800 border-amber-200",
    Confirmed: "bg-sky-50 text-sky-800 border-sky-200",
    Packed: "bg-indigo-50 text-indigo-800 border-indigo-200",
    "Out for Delivery": "bg-blue-50 text-blue-800 border-blue-200",
    Delivered: "bg-green-50 text-green-800 border-green-200",
    Cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200",
    "Awaiting Payment": "bg-orange-50 text-orange-800 border-orange-200",
    Pending: "bg-amber-50 text-amber-800 border-amber-200",
    Approved: "bg-green-50 text-green-800 border-green-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
    Ready: "bg-green-50 text-green-800 border-green-200",
    Paid: "bg-green-50 text-green-800 border-green-200",
    Unpaid: "bg-amber-50 text-amber-800 border-amber-200",
    Active: "bg-green-50 text-green-800 border-green-200",
    Inactive: "bg-zinc-100 text-zinc-500 border-zinc-200",
    Hidden: "bg-zinc-100 text-zinc-500 border-zinc-200",
    Visible: "bg-green-50 text-green-800 border-green-200",
    Blocked: "bg-red-50 text-red-700 border-red-200",
    "In stock": "bg-green-50 text-green-800 border-green-200",
    "Low stock": "bg-amber-50 text-amber-800 border-amber-200",
    "Out of stock": "bg-red-50 text-red-700 border-red-200",
    Admin: "bg-[#202b23] text-white border-[#202b23]",
    Vendor: "bg-orange-50 text-orange-800 border-orange-200",
    Customer: "bg-[#f3f0ea] text-[#5f5a52] border-[#e1dbd0]",
};

export const Badge = ({ label }: { label: string }) => (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold border rounded-full whitespace-nowrap ${tones[label] ?? "bg-[#f3f0ea] text-[#5f5a52] border-[#e1dbd0]"}`}>{label}</span>
);

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
    <label className="block">
        <span className="block text-xs font-semibold text-[#5f5a52] mb-1.5">{label}</span>
        {children}
        {hint && <span className="block text-[11px] text-[#9a948a] mt-1">{hint}</span>}
    </label>
);

// Filter buttons (tabs)
export const Tabs = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[] }) => (
    <div className="flex flex-wrap gap-2 mb-4">
        {options.map(([key, label]) => (
            <button key={key} onClick={() => onChange(key)} className={`px-3 py-1.5 text-sm border ${value === key ? "bg-[#202b23] text-white border-[#202b23]" : "bg-[#fbfaf7] border-[#d9d4cb] hover:border-[#e66f43]"}`}>{label}</button>
        ))}
    </div>
);

// Table wrapper with header row and empty message
export const Table = ({ head, children, empty, loading }: { head: string[]; children: ReactNode; empty?: boolean; loading?: boolean }) => (
    <div className="bg-[#fbfaf7] border border-[#d9d4cb] overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#777269] bg-[#f3f0ea]"><tr>{head.map((h, i) => <th key={i} className="px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
        {empty && !loading && <div className="p-12 text-center text-sm text-[#777269]">Nothing here yet.</div>}
        {empty && loading && <div className="p-12 text-center text-sm text-[#777269]">Loading...</div>}
    </div>
);
export const Td = ({ children, className = "" }: { children: ReactNode; className?: string }) => <td className={`px-4 py-3 ${className}`}>{children}</td>;

// Slide-in panel from the right (forms, details)
export const Drawer = ({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) => (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
        <div onClick={e => e.stopPropagation()} className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} h-full bg-[#fbfaf7] flex flex-col`}>
            <div className="border-b border-[#e7e2d9] px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button type="button" onClick={onClose} className="p-1.5 hover:bg-[#f0ece4]"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
            {footer && <div className="border-t border-[#e7e2d9] px-6 py-4 flex justify-end gap-2">{footer}</div>}
        </div>
    </div>
);

export const SearchBox = ({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string }) => (
    <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="flex-1 min-w-[220px]">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </form>
);