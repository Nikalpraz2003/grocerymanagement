import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi, adminError, type Customer } from "../../services/adminApi";
import { Badge, ErrorBox, PageHeader, SearchBox, Table, Tabs, Td, btnDanger, btnLight, rs, shortDate } from "../../components/admin/ui";
import authService from "../../services/authServices";

const roleTabs = [["all", "Everyone"], ["Customer", "Customers"], ["Vendor", "Vendors"], ["Admin", "Admins"]] as const;

const AdminCustomers = () => {
    const me = authService.getCurrentUser();
    const [rows, setRows] = useState<Customer[]>([]);
    const [role, setRole] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try { setRows(await adminApi.customers(role, search)); }
        catch (e) { setError(adminError(e, "Unable to load customers")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [role]);   // eslint-disable-line react-hooks/exhaustive-deps

    const toggleBlock = async (c: Customer) => {
        if (!confirm(c.isActive ? `Block ${c.name}? They will not be able to log in.` : `Unblock ${c.name}?`)) return;
        try { const r = await adminApi.setCustomerActive(c._id, !c.isActive); toast.success(r.message); void load(); }
        catch (e) { toast.error(adminError(e)); }
    };
    const changeRole = async (c: Customer, newRole: string) => {
        if (newRole === c.role) return;
        if (!confirm(`Change ${c.name} from ${c.role} to ${newRole}?`)) { void load(); return; }
        try { const r = await adminApi.setCustomerRole(c._id, newRole); toast.success(r.message); void load(); }
        catch (e) { toast.error(adminError(e)); void load(); }
    };

    return (
        <section className="p-4 sm:p-8 max-w-[1500px] mx-auto">
            <PageHeader title="Customers" subtitle={`${rows.length} account${rows.length === 1 ? "" : "s"}`} loading={loading} onRefresh={() => void load()} />
            <Tabs value={role} onChange={setRole} options={roleTabs} />
            <div className="flex gap-2 mb-5"><SearchBox value={search} onChange={setSearch} onSubmit={() => void load()} placeholder="Search name, email or phone, press Enter..." /></div>
            {error && <ErrorBox message={error} />}
            <Table head={["Name", "Contact", "Role", "Orders", "Spent", "Last order", "Joined", "Status", ""]} empty={rows.length === 0} loading={loading}>
                {rows.map(c => {
                    const isMe = c._id === me?._id;
                    return (
                        <tr key={c._id} className="border-t border-[#e7e2d9]">
                            <Td><p className="font-medium">{c.name || "-"}{isMe && <span className="text-[11px] text-[#9a948a]"> (you)</span>}</p></Td>
                            <Td><p className="text-xs">{c.email}</p><p className="text-[11px] text-[#9a948a]">{c.phone}</p></Td>
                            <Td>
                                <select value={c.role} disabled={isMe} onChange={e => void changeRole(c, e.target.value)} className="px-2 py-1 text-xs border border-[#d9d4cb] bg-white disabled:opacity-60">
                                    <option>Customer</option><option>Vendor</option><option>Admin</option>
                                </select>
                            </Td>
                            <Td>{c.orderCount}</Td>
                            <Td>{rs(c.totalSpent)}</Td>
                            <Td className="text-xs text-[#777269]">{shortDate(c.lastOrderAt)}</Td>
                            <Td className="text-xs text-[#777269]">{shortDate(c.createdAt)}</Td>
                            <Td><Badge label={c.isActive ? "Active" : "Blocked"} /></Td>
                            <Td>{!isMe && <button onClick={() => void toggleBlock(c)} className={c.isActive ? btnDanger : btnLight}>{c.isActive ? "Block" : "Unblock"}</button>}</Td>
                        </tr>
                    );
                })}
            </Table>
            <p className="text-xs text-[#9a948a] mt-3">After a role change, the person must log out and log in again to get the new access.</p>
        </section>
    );
};

export default AdminCustomers;