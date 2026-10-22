import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, adminError, type Review } from "../../services/adminApi";
import { Badge, ErrorBox, PageHeader, Table, Tabs, Td, btnLight, dateTime, iconBtn } from "../../components/admin/ui";

const tabs = [["all", "All"], ["visible", "Visible"], ["hidden", "Hidden"]] as const;

const Stars = ({ n }: { n: number }) => (
    <span className="inline-flex">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} className={i <= n ? "fill-amber-400 text-amber-400" : "text-[#d9d4cb]"} />)}</span>
);

const AdminReviews = () => {
    const [rows, setRows] = useState<Review[]>([]);
    const [tab, setTab] = useState("all");
    const [rating, setRating] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setRows(await adminApi.reviews(tab === "all" ? undefined : tab === "visible", rating === "all" ? undefined : Number(rating))); }
        catch (e) { setError(adminError(e, "Unable to load reviews")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [tab, rating]);   // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = async (r: Review) => {
        try { await adminApi.setReviewVisible(r._id, !r.isVisible); toast.success(r.isVisible ? "Review hidden" : "Review visible again"); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };
    const remove = async (r: Review) => {
        if (!confirm("Delete this review for good? Hiding it keeps it for your records.")) return;
        try { const x = await adminApi.deleteReview(r._id); toast.success(x.message); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };

    return (
        <section className="p-4 sm:p-8 max-w-[1400px] mx-auto">
            <PageHeader title="Reviews" subtitle="Hidden reviews don't show in the shop or count in the product rating." loading={loading} onRefresh={() => void load()}>
                <select value={rating} onChange={e => setRating(e.target.value)} className="px-3 py-2 text-sm border border-[#d9d4cb] bg-[#fbfaf7]">
                    <option value="all">All ratings</option>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
                </select>
            </PageHeader>
            <Tabs value={tab} onChange={setTab} options={tabs} />
            {error && <ErrorBox message={error} />}
            <Table head={["Product", "Customer", "Rating", "Comment", "Date", "Status", ""]} empty={rows.length === 0} loading={loading}>
                {rows.map(r => (
                    <tr key={r._id} className="border-t border-[#e7e2d9] align-top">
                        <Td className="font-medium">{r.productName}</Td>
                        <Td>{r.userName}</Td>
                        <Td><Stars n={r.rating} /></Td>
                        <Td className="max-w-[380px] text-[#4a463f]">{r.comment || <span className="text-[#9a948a]">(no comment)</span>}</Td>
                        <Td className="text-xs text-[#777269] whitespace-nowrap">{dateTime(r.createdAt)}</Td>
                        <Td><Badge label={r.isVisible ? "Visible" : "Hidden"} /></Td>
                        <Td><div className="flex gap-2 justify-end">
                            <button onClick={() => void toggle(r)} className={btnLight}>{r.isVisible ? "Hide" : "Show"}</button>
                            <button onClick={() => void remove(r)} className={iconBtn} title="Delete"><Trash2 size={15} className="text-red-500" /></button>
                        </div></Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
};

export default AdminReviews;