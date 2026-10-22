import { useEffect, useState } from "react";
import { Check, ExternalLink, Eye, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, adminError, type VendorApplication as BaseApplication } from "../../services/adminApi";
import { api } from "../../services/authServices";
import { Badge, Drawer, ErrorBox, Field, PageHeader, Table, Tabs, Td, btnDanger, btnLight, btnOrange, dateTime, iconBtn, inputCls, shortDate } from "../../components/admin/ui";

// Application with ID / PAN / bank details and uploaded files
interface VendorDoc { _id: string; type: string; label: string; fileName: string; contentType: string; size: number }
type VendorApplication = BaseApplication & {
    idType: string; idNumber: string; panNumber: string; businessRegNumber: string;
    bankName: string; bankAccountName: string; bankAccountNumber: string; bankBranch: string;
    documents: VendorDoc[];
};

// Loads one private file with the admin's token and shows it (image preview or PDF link)
const DocCard = ({ appId, doc }: { appId: string; doc: VendorDoc }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;
        api.get(`/api/admin/vendors/${appId}/documents/${doc._id}`, { responseType: "blob", timeout: 60000 })
            .then(res => { objectUrl = URL.createObjectURL(res as unknown as Blob); setUrl(objectUrl); })
            .catch(() => setFailed(true));
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [appId, doc._id]);

    const isImage = doc.contentType.startsWith("image/");
    return (
        <div className="border border-[#e7e2d9] bg-white">
            <a href={url ?? undefined} target="_blank" rel="noreferrer" className="block aspect-[4/3] bg-[#f3f0ea] overflow-hidden">
                {failed ? <div className="h-full flex items-center justify-center text-xs text-red-600 p-2 text-center">Could not load file</div>
                    : !url ? <div className="h-full flex items-center justify-center text-xs text-[#9a948a]">Loading...</div>
                    : isImage ? <img src={url} alt={doc.label} className="w-full h-full object-cover hover:opacity-90" />
                    : <div className="h-full flex flex-col items-center justify-center gap-1 text-red-600"><FileText size={28} /><span className="text-[11px]">PDF</span></div>}
            </a>
            <div className="px-2.5 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0"><p className="text-xs font-semibold truncate">{doc.label}</p><p className="text-[10px] text-[#9a948a] truncate">{doc.fileName} · {(doc.size / 1024).toFixed(0)} KB</p></div>
                {url && <a href={url} target="_blank" rel="noreferrer" className="p-1 hover:bg-[#f0ece4]" title="Open full size"><ExternalLink size={14} /></a>}
            </div>
        </div>
    );
};

const tabs = [["Pending", "Pending"], ["Approved", "Approved"], ["Rejected", "Rejected"], ["all", "All"]] as const;

// Details + approve / reject
const VendorDrawer = ({ app, onClose, onDone }: { app: VendorApplication; onClose: () => void; onDone: () => void }) => {
    const [note, setNote] = useState(app.adminNote ?? "");
    const [rate, setRate] = useState(String(app.commissionRate));
    const [busy, setBusy] = useState(false);

    const approve = async () => {
        const r = Number(rate);
        if (Number.isNaN(r) || r < 0 || r > 100) { toast.error("Commission must be 0 to 100"); return; }
        setBusy(true);
        try { await adminApi.approveVendor(app._id, note, r); toast.success(`${app.storeName} approved. They must log in again to open the Seller Panel.`); onDone(); }
        catch (e) { toast.error(adminError(e)); }
        finally { setBusy(false); }
    };
    const reject = async () => {
        if (!note.trim()) { toast.error("Write a reason in the note so the seller knows why"); return; }
        if (!confirm(`Reject ${app.storeName}?`)) return;
        setBusy(true);
        try { await adminApi.rejectVendor(app._id, note); toast.success("Application rejected"); onDone(); }
        catch (e) { toast.error(adminError(e)); }
        finally { setBusy(false); }
    };

    const row = (label: string, value: string) => (
        <div className="flex justify-between gap-4 py-2 border-b border-[#f0ece4] text-sm"><span className="text-[#777269]">{label}</span><span className="text-right font-medium">{value || "-"}</span></div>
    );

    return (
        <Drawer title={app.storeName} onClose={onClose}
            footer={<>
                {app.status !== "Rejected" && <button disabled={busy} onClick={() => void reject()} className={btnDanger}><X size={16} /> Reject</button>}
                {app.status !== "Approved" && <button disabled={busy} onClick={() => void approve()} className={btnOrange}><Check size={16} /> Approve</button>}
                {app.status === "Approved" && <button disabled={busy} onClick={() => void approve()} className={btnLight}>Save commission</button>}
            </>}>
            <div className="flex items-center gap-2"><Badge label={app.status} /><span className="text-xs text-[#9a948a]">{app.appId} · applied {dateTime(app.createdAt)}</span></div>
            <div className="bg-white border border-[#e7e2d9] px-4">
                {row("Owner", app.ownerName)}
                {row("Email", app.email)}
                {row("Phone", app.phone)}
                {row("Category", app.category)}
                {row("City", app.city)}
                {row("Address", app.address)}
                {row("PAN / VAT", app.hasPanVat ? `Yes${app.panNumber ? ` · ${app.panNumber}` : ""}` : app.panNumber || "No")}
                {row(app.idType === "NID" ? "NID number" : "Citizenship no.", app.idNumber)}
                {app.businessRegNumber && row("Business reg. no.", app.businessRegNumber)}
                {row("Daily capacity", app.dailyCapacity)}
                {row("Linked account", app.userId ? "Yes" : "Not yet (linked by email on approval)")}
                {app.reviewedAt && row("Reviewed", dateTime(app.reviewedAt))}
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6f6a61] mb-2">Documents ({app.documents?.length ?? 0})</p>
                {app.documents?.length ? (
                    <div className="grid grid-cols-2 gap-3">{app.documents.map(d => <DocCard key={d._id} appId={app._id} doc={d} />)}</div>
                ) : <p className="text-sm text-[#9a948a]">No files uploaded (applied before documents were required).</p>}
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6f6a61] mb-2">Bank for payouts</p>
                <div className="bg-white border border-[#e7e2d9] px-4">
                    {row("Bank", app.bankName)}
                    {row("Branch", app.bankBranch)}
                    {row("Account name", app.bankAccountName)}
                    {row("Account number", app.bankAccountNumber)}
                </div>
            </div>
            <Field label="Commission (%)" hint="Pasalmandu keeps this % of the seller's delivered sales">
                <input type="number" min={0} max={100} step="0.5" value={rate} onChange={e => setRate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Note" hint="Required when rejecting. The seller can see it.">
                <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className={inputCls} />
            </Field>
            <p className="text-xs text-[#9a948a]">Approving needs an account with the same email as the application. If there is none, ask the seller to register first.</p>
        </Drawer>
    );
};

const AdminVendors = () => {
    const [rows, setRows] = useState<VendorApplication[]>([]);
    const [tab, setTab] = useState("Pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState<VendorApplication | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setRows(await adminApi.vendors(tab) as VendorApplication[]); }
        catch (e) { setError(adminError(e, "Unable to load vendors")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [tab]);   // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <section className="p-4 sm:p-8 max-w-[1400px] mx-auto">
            <PageHeader title="Vendors" subtitle="Seller applications. Approve to give the account the Vendor role." loading={loading} onRefresh={() => void load()} />
            <Tabs value={tab} onChange={setTab} options={tabs} />
            {error && <ErrorBox message={error} />}
            <Table head={["Store", "Owner", "Contact", "City", "Commission", "Status", "Applied", ""]} empty={rows.length === 0} loading={loading}>
                {rows.map(v => (
                    <tr key={v._id} className="border-t border-[#e7e2d9] hover:bg-white cursor-pointer" onClick={() => setOpen(v)}>
                        <Td><p className="font-medium">{v.storeName}</p><p className="text-[11px] text-[#9a948a]">{v.appId} · {v.category} · {v.documents?.length ?? 0} files</p></Td>
                        <Td>{v.ownerName}</Td>
                        <Td><p className="text-xs">{v.email}</p><p className="text-[11px] text-[#9a948a]">{v.phone}</p></Td>
                        <Td>{v.city}</Td>
                        <Td>{v.commissionRate}%</Td>
                        <Td><Badge label={v.status} /></Td>
                        <Td className="text-xs text-[#777269]">{shortDate(v.createdAt)}</Td>
                        <Td><button className={iconBtn} title="Open"><Eye size={15} /></button></Td>
                    </tr>
                ))}
            </Table>
            {open && <VendorDrawer app={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); void load(); }} />}
        </section>
    );
};

export default AdminVendors;