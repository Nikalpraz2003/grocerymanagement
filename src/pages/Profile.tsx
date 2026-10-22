import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    ArrowLeftIcon,
    CalendarDaysIcon,
    ChevronRightIcon,
    EyeIcon,
    EyeOffIcon,
    LockKeyholeIcon,
    MailIcon,
    MapPinIcon,
    PackageIcon,
    PencilIcon,
    PhoneIcon,
    SaveIcon,
    ShieldCheckIcon,
    UserIcon,
    XIcon,
} from "lucide-react";

interface ProfileDetails {
    name: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    dateOfBirth: string;
}

const DEFAULT_PROFILE: ProfileDetails = {
    name: "Nikal Prajapati",
    email: "nikal@example.com",
    phone: "98XXXXXXXX",
    age: "23",
    gender: "Male",
    dateOfBirth: "2003-05-15",
};

const PROFILE_STORAGE_KEY = "pasalmandu-profile-details";

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileDetails>(() => {
        try {
            const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
            return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
        } catch {
            return DEFAULT_PROFILE;
        }
    });

    const [draft, setDraft] = useState(profile);
    const [editingProfile, setEditingProfile] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
    const [emailForm, setEmailForm] = useState({ email: "", password: "" });

    useEffect(() => {
        setDraft(profile);
    }, [profile]);

    const passwordStrength = useMemo(() => {
        const password = passwordForm.next;
        if (!password) return { label: "", width: "w-0" };
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        if (score <= 1) return { label: "Weak", width: "w-1/4" };
        if (score === 2) return { label: "Fair", width: "w-2/4" };
        if (score === 3) return { label: "Good", width: "w-3/4" };
        return { label: "Strong", width: "w-full" };
    }, [passwordForm.next]);

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        const age = Number(draft.age);
        if (!draft.name.trim()) {
            toast.error("Please enter your name.");
            return;
        }
        if (!draft.phone.trim()) {
            toast.error("Please enter your phone number.");
            return;
        }
        if (!Number.isInteger(age) || age < 13 || age > 120) {
            toast.error("Please enter a valid age between 13 and 120.");
            return;
        }

        setProfile(draft);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(draft));
        setEditingProfile(false);
        toast.success("Profile updated successfully.");
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordForm.current) {
            toast.error("Enter your current password.");
            return;
        }
        if (passwordForm.next.length < 8) {
            toast.error("New password must be at least 8 characters.");
            return;
        }
        if (passwordForm.next === passwordForm.current) {
            toast.error("New password must be different from your current password.");
            return;
        }
        if (passwordForm.next !== passwordForm.confirm) {
            toast.error("Passwords do not match.");
            return;
        }

        // Frontend-only for now. Connect this action to the backend later.
        setPasswordForm({ current: "", next: "", confirm: "" });
        setShowPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setShowPasswordModal(false);
        toast.success("Password changed successfully.");
    };

    const handleEmailChange = (e: React.FormEvent) => {
        e.preventDefault();
        const nextEmail = emailForm.email.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(nextEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }
        if (!emailForm.password) {
            toast.error("Enter your current password to change email.");
            return;
        }
        if (nextEmail === profile.email.toLowerCase()) {
            toast.error("This is already your current email.");
            return;
        }

        const updated = { ...profile, email: nextEmail };
        setProfile(updated);
        setDraft(updated);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        setEmailForm({ email: "", password: "" });
        setShowEmailModal(false);
        toast.success("Email address updated successfully.");
    };

    const inputClass =
        "w-full rounded-xl border border-app-border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-app-green focus:ring-2 focus:ring-app-green/10";

    return (
        <div className="min-h-screen bg-app-cream py-8 sm:py-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-xl border border-app-border bg-white p-2.5 text-zinc-600 transition hover:bg-orange-50 hover:text-app-orange"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon size={18} />
                    </button>
                    <div>
                        <p className="text-sm text-zinc-500">Account</p>
                        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">My Profile</h1>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="h-fit rounded-2xl border border-app-border bg-white p-5 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex size-24 items-center justify-center rounded-full bg-app-green text-3xl font-bold text-white shadow-sm">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="mt-4 text-lg font-semibold text-zinc-900">{profile.name}</h2>
                            <p className="mt-1 break-all text-xs text-zinc-500">{profile.email}</p>
                        </div>

                        <div className="my-5 border-t border-app-border" />

                        <nav className="space-y-1">
                            <Link to="/profile" className="flex items-center gap-3 rounded-xl bg-orange-50 px-3 py-2.5 text-sm font-semibold text-app-orange">
                                <UserIcon size={17} /> My Profile
                            </Link>
                            <Link to="/orders" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 transition hover:bg-orange-50 hover:text-app-orange">
                                <PackageIcon size={17} /> My Orders
                                <ChevronRightIcon className="ml-auto" size={15} />
                            </Link>
                            <Link to="/addresses" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 transition hover:bg-orange-50 hover:text-app-orange">
                                <MapPinIcon size={17} /> My Addresses
                                <ChevronRightIcon className="ml-auto" size={15} />
                            </Link>
                        </nav>
                    </aside>

                    <main className="space-y-6">
                        <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-900">Personal Information</h2>
                                    <p className="mt-1 text-sm text-zinc-500">Manage your basic account details.</p>
                                </div>
                                {!editingProfile && (
                                    <button
                                        onClick={() => setEditingProfile(true)}
                                        className="flex items-center gap-2 rounded-xl bg-app-green px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                                    >
                                        <PencilIcon size={16} /> Edit
                                    </button>
                                )}
                            </div>

                            {editingProfile ? (
                                <form onSubmit={handleProfileSave} className="grid gap-4 sm:grid-cols-2">
                                    <label className="sm:col-span-2">
                                        <span className="mb-2 block text-sm font-medium text-zinc-700">Full Name</span>
                                        <input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                                    </label>
                                    <label>
                                        <span className="mb-2 block text-sm font-medium text-zinc-700">Phone Number</span>
                                        <input className={inputClass} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                                    </label>
                                    <label>
                                        <span className="mb-2 block text-sm font-medium text-zinc-700">Age</span>
                                        <input type="number" min="13" max="120" className={inputClass} value={draft.age} onChange={(e) => setDraft({ ...draft, age: e.target.value })} />
                                    </label>
                                    <label>
                                        <span className="mb-2 block text-sm font-medium text-zinc-700">Gender</span>
                                        <select className={inputClass} value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                            <option>Prefer not to say</option>
                                        </select>
                                    </label>
                                    <label>
                                        <span className="mb-2 block text-sm font-medium text-zinc-700">Date of Birth</span>
                                        <input type="date" className={inputClass} value={draft.dateOfBirth} onChange={(e) => setDraft({ ...draft, dateOfBirth: e.target.value })} />
                                    </label>
                                    <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
                                        <button type="button" onClick={() => { setDraft(profile); setEditingProfile(false); }} className="rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                                            Cancel
                                        </button>
                                        <button type="submit" className="flex items-center gap-2 rounded-xl bg-app-green px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                                            <SaveIcon size={16} /> Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <InfoRow icon={<UserIcon size={17} />} label="Full Name" value={profile.name} />
                                    <InfoRow icon={<PhoneIcon size={17} />} label="Phone Number" value={profile.phone} />
                                    <InfoRow icon={<CalendarDaysIcon size={17} />} label="Age" value={`${profile.age} years`} />
                                    <InfoRow icon={<UserIcon size={17} />} label="Gender" value={profile.gender} />
                                    <InfoRow icon={<CalendarDaysIcon size={17} />} label="Date of Birth" value={profile.dateOfBirth || "Not added"} />
                                    <InfoRow icon={<MailIcon size={17} />} label="Email" value={profile.email} />
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-zinc-900">Account & Security</h2>
                                <p className="mt-1 text-sm text-zinc-500">Keep your account information secure.</p>
                            </div>

                            <div className="divide-y divide-app-border">
                                <button onClick={() => setShowEmailModal(true)} className="flex w-full items-center gap-4 py-4 text-left transition hover:bg-orange-50/50">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-app-orange"><MailIcon size={19} /></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-zinc-900">Email Address</p>
                                        <p className="truncate text-xs text-zinc-500">{profile.email}</p>
                                    </div>
                                    <span className="flex items-center gap-1 text-sm font-medium text-app-orange">Change <ChevronRightIcon size={16} /></span>
                                </button>
                                <button onClick={() => setShowPasswordModal(true)} className="flex w-full items-center gap-4 py-4 text-left transition hover:bg-orange-50/50">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-app-green"><LockKeyholeIcon size={19} /></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-zinc-900">Password</p>
                                        <p className="text-xs text-zinc-500">Update your account password</p>
                                    </div>
                                    <span className="flex items-center gap-1 text-sm font-medium text-app-orange">Change <ChevronRightIcon size={16} /></span>
                                </button>
                                <div className="flex items-center gap-4 py-4">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheckIcon size={19} /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900">Account Security</p>
                                        <p className="text-xs text-zinc-500">Never share your password with anyone.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-2">
                            <Link to="/orders" className="group flex items-center gap-4 rounded-2xl border border-app-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-app-orange"><PackageIcon size={21} /></div>
                                <div className="flex-1"><h3 className="font-semibold text-zinc-900">My Orders</h3><p className="text-xs text-zinc-500">View your purchase history</p></div>
                                <ChevronRightIcon className="text-zinc-400 transition group-hover:text-app-orange" size={18} />
                            </Link>
                            <Link to="/addresses" className="group flex items-center gap-4 rounded-2xl border border-app-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-green-50 text-app-green"><MapPinIcon size={21} /></div>
                                <div className="flex-1"><h3 className="font-semibold text-zinc-900">My Addresses</h3><p className="text-xs text-zinc-500">Manage delivery addresses</p></div>
                                <ChevronRightIcon className="text-zinc-400 transition group-hover:text-app-orange" size={18} />
                            </Link>
                        </section>
                    </main>
                </div>
            </div>

            {showPasswordModal && (
                <Modal title="Change Password" onClose={() => setShowPasswordModal(false)}>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <PasswordInput label="Current Password" value={passwordForm.current} show={showPassword} onToggle={() => setShowPassword(!showPassword)} onChange={(value) => setPasswordForm({ ...passwordForm, current: value })} />
                        <PasswordInput label="New Password" value={passwordForm.next} show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} onChange={(value) => setPasswordForm({ ...passwordForm, next: value })} />
                        {passwordForm.next && (
                            <div>
                                <div className="mb-1 flex justify-between text-xs"><span className="text-zinc-500">Password strength</span><span className="font-medium text-zinc-700">{passwordStrength.label}</span></div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full bg-app-green transition-all ${passwordStrength.width}`} /></div>
                            </div>
                        )}
                        <PasswordInput label="Confirm New Password" value={passwordForm.confirm} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} onChange={(value) => setPasswordForm({ ...passwordForm, confirm: value })} />
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowPasswordModal(false)} className="rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
                            <button type="submit" className="rounded-xl bg-app-green px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Change Password</button>
                        </div>
                    </form>
                </Modal>
            )}

            {showEmailModal && (
                <Modal title="Change Email Address" onClose={() => setShowEmailModal(false)}>
                    <form onSubmit={handleEmailChange} className="space-y-4">
                        <div className="rounded-xl bg-orange-50 p-3 text-sm text-zinc-700"><span className="font-medium">Current email:</span> {profile.email}</div>
                        <label><span className="mb-2 block text-sm font-medium text-zinc-700">New Email</span><input type="email" required className={inputClass} value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} placeholder="newemail@example.com" /></label>
                        <PasswordInput label="Current Password" value={emailForm.password} show={showPassword} onToggle={() => setShowPassword(!showPassword)} onChange={(value) => setEmailForm({ ...emailForm, password: value })} />
                        <p className="text-xs text-zinc-500">For a production version, this change should be followed by email verification.</p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowEmailModal(false)} className="rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
                            <button type="submit" className="rounded-xl bg-app-green px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Update Email</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 text-app-green">{icon}</div>
        <div className="min-w-0"><p className="text-xs text-zinc-500">{label}</p><p className="mt-0.5 break-words text-sm font-medium text-zinc-900">{value}</p></div>
    </div>
);

const PasswordInput = ({ label, value, show, onToggle, onChange }: { label: string; value: string; show: boolean; onToggle: () => void; onChange: (value: string) => void }) => (
    <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
        <div className="relative">
            <input type={show ? "text" : "password"} required value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-app-border bg-white px-4 py-3 pr-11 text-sm outline-none transition focus:border-app-green focus:ring-2 focus:ring-app-green/10" />
            <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
        </div>
    </label>
);

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
                <button onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Close"><XIcon size={19} /></button>
            </div>
            {children}
        </div>
    </div>
);

export default Profile;
