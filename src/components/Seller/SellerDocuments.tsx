import { useEffect, useState } from "react";
import { FileText, Landmark, ShieldCheck, Upload, X } from "lucide-react";

// Extra sections for the "Become a Seller" form: identity, documents and bank details.
// The parent page keeps the state; buildApplicationData() turns everything into FormData for the API.

export type DocKey = "citizenshipFront" | "citizenshipBack" | "nationalId" | "panCertificate" | "businessRegistration" | "shopPhoto" | "ownerPhoto";
export type SellerDocs = Record<DocKey, File | null>;
export interface SellerExtra {
    idType: "Citizenship" | "NID"; idNumber: string; panNumber: string; businessRegNumber: string;
    bankName: string; bankAccountName: string; bankAccountNumber: string; bankBranch: string;
}

export const emptyDocs: SellerDocs = { citizenshipFront: null, citizenshipBack: null, nationalId: null, panCertificate: null, businessRegistration: null, shopPhoto: null, ownerPhoto: null };
export const emptyExtra: SellerExtra = { idType: "Citizenship", idNumber: "", panNumber: "", businessRegNumber: "", bankName: "", bankAccountName: "", bankAccountNumber: "", bankBranch: "" };

const MAX_MB = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const labels: Record<DocKey, string> = {
    citizenshipFront: "Citizenship (front)", citizenshipBack: "Citizenship (back)", nationalId: "National ID (NID) card",
    panCertificate: "PAN / VAT certificate", businessRegistration: "Business registration certificate",
    shopPhoto: "Shop photo (front of the shop)", ownerPhoto: "Owner photo",
};
// Form field names the API expects (VendorApplyForm in the .NET API)
const apiField: Record<DocKey, string> = {
    citizenshipFront: "CitizenshipFront", citizenshipBack: "CitizenshipBack", nationalId: "NationalId",
    panCertificate: "PanCertificate", businessRegistration: "BusinessRegistration", shopPhoto: "ShopPhoto", ownerPhoto: "OwnerPhoto",
};

const inputCls = "w-full px-4 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-app-green focus:outline-none";
const Label = ({ children }: { children: React.ReactNode }) => <label className="block text-xs font-semibold text-zinc-700 mb-1">{children}</label>;

// Which files are required for the current answers
export const requiredDocs = (idType: SellerExtra["idType"], hasPanVat: string): DocKey[] => [
    ...(idType === "NID" ? ["nationalId" as const] : ["citizenshipFront" as const, "citizenshipBack" as const]),
    ...(hasPanVat === "yes" ? ["panCertificate" as const] : []),
    "shopPhoto",
];

// ---------- One upload box with preview ----------
const FileBox = ({ docKey, file, required, onChange }: { docKey: DocKey; file: File | null; required: boolean; onChange: (f: File | null) => void }) => {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!file || !file.type.startsWith("image/")) { setPreview(null); return; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        e.target.value = "";            // allows picking the same file again
        if (!f) return;
        if (!ACCEPT.split(",").includes(f.type)) { alert("Please choose a JPG, PNG, WEBP or PDF file."); return; }
        if (f.size > MAX_MB * 1024 * 1024) { alert(`This file is larger than ${MAX_MB} MB. Please choose a smaller one.`); return; }
        onChange(f);
    };

    return (
        <div>
            <Label>{labels[docKey]} {required ? "*" : <span className="font-normal text-zinc-400">(optional)</span>}</Label>
            {file ? (
                <div className="flex items-center gap-3 p-2.5 border border-zinc-200 rounded-xl bg-white">
                    {preview
                        ? <img src={preview} alt="" className="size-14 rounded-lg object-cover bg-zinc-100" />
                        : <div className="size-14 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><FileText className="size-6" /></div>}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{file.name}</p>
                        <p className="text-[11px] text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => onChange(null)} className="p-1.5 rounded-lg hover:bg-zinc-100" title="Remove"><X className="size-4" /></button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center gap-1 h-[78px] border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50 hover:border-app-orange hover:bg-orange-50/40 cursor-pointer transition">
                    <Upload className="size-4 text-zinc-500" />
                    <span className="text-[11px] text-zinc-500">Click to upload · JPG, PNG or PDF · max {MAX_MB} MB</span>
                    <input type="file" accept={ACCEPT} onChange={pick} className="hidden" />
                </label>
            )}
        </div>
    );
};

// ---------- The sections shown in the form ----------
const SellerDocuments = ({ hasPanVat, docs, setDocs, extra, setExtra }: {
    hasPanVat: string;
    docs: SellerDocs; setDocs: React.Dispatch<React.SetStateAction<SellerDocs>>;
    extra: SellerExtra; setExtra: React.Dispatch<React.SetStateAction<SellerExtra>>;
}) => {
    const req = requiredDocs(extra.idType, hasPanVat);
    const set = (k: keyof SellerExtra) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setExtra(x => ({ ...x, [k]: e.target.value }));
    const box = (k: DocKey) => <FileBox docKey={k} file={docs[k]} required={req.includes(k)} onChange={f => setDocs(d => ({ ...d, [k]: f }))} />;

    return (
        <>
            {/* Section D: Identity & documents */}
            <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-sm font-bold uppercase tracking-wider text-app-green flex items-center gap-2 mb-1">
                    <ShieldCheck className="size-4 text-app-orange" />
                    <span>4. Identity & Documents</span>
                </h4>
                <p className="text-xs text-zinc-500 mb-4">Only the Pasalmandu team can see these files. They are used to verify your store.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <Label>Identity document *</Label>
                        <select value={extra.idType} onChange={set("idType")} className={inputCls}>
                            <option value="Citizenship">Nepali Citizenship Certificate</option>
                            <option value="NID">National ID (NID) Card</option>
                        </select>
                    </div>
                    <div>
                        <Label>{extra.idType === "NID" ? "NID number *" : "Citizenship number *"}</Label>
                        <input required value={extra.idNumber} onChange={set("idNumber")} placeholder={extra.idType === "NID" ? "e.g. 123-456-789-0" : "e.g. 27-01-75-01234"} className={inputCls} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {extra.idType === "NID" ? box("nationalId") : <>{box("citizenshipFront")}{box("citizenshipBack")}</>}
                    {box("shopPhoto")}
                    {box("ownerPhoto")}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                        <Label>PAN / VAT number {hasPanVat === "yes" ? "*" : <span className="font-normal text-zinc-400">(if you have one)</span>}</Label>
                        <input required={hasPanVat === "yes"} value={extra.panNumber} onChange={set("panNumber")} placeholder="9 digits, e.g. 601234567" className={inputCls} />
                    </div>
                    <div>
                        <Label>Business registration number <span className="font-normal text-zinc-400">(optional)</span></Label>
                        <input value={extra.businessRegNumber} onChange={set("businessRegNumber")} placeholder="Ward / company registration no." className={inputCls} />
                    </div>
                    {box("panCertificate")}
                    {box("businessRegistration")}
                </div>
            </div>

            {/* Section E: Bank details */}
            <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-sm font-bold uppercase tracking-wider text-app-green flex items-center gap-2 mb-1">
                    <Landmark className="size-4 text-app-orange" />
                    <span>5. Bank Details for Payouts</span>
                </h4>
                <p className="text-xs text-zinc-500 mb-4">Where we send your earnings. You can add this later, but payouts need it.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Bank name</Label><input value={extra.bankName} onChange={set("bankName")} placeholder="e.g. Nabil Bank" className={inputCls} /></div>
                    <div><Label>Branch</Label><input value={extra.bankBranch} onChange={set("bankBranch")} placeholder="e.g. New Baneshwor" className={inputCls} /></div>
                    <div><Label>Account holder name</Label><input value={extra.bankAccountName} onChange={set("bankAccountName")} className={inputCls} /></div>
                    <div><Label>Account number</Label><input value={extra.bankAccountNumber} onChange={set("bankAccountNumber")} className={inputCls} /></div>
                </div>
            </div>
        </>
    );
};

export default SellerDocuments;

// Checks the files and builds the multipart body for POST /api/vendors/apply.
// Returns { error } when something required is missing.
export const buildApplicationData = (
    form: Record<string, string | boolean>, extra: SellerExtra, docs: SellerDocs,
): { data?: FormData; error?: string } => {
    const missing = requiredDocs(extra.idType, String(form.hasPanVat)).filter(k => !docs[k]).map(k => labels[k]);
    if (missing.length) return { error: `Please upload: ${missing.join(", ")}` };
    if (!extra.idNumber.trim()) return { error: `Please enter your ${extra.idType === "NID" ? "NID" : "citizenship"} number` };
    if (form.hasPanVat === "yes" && !extra.panNumber.trim()) return { error: "Please enter your PAN / VAT number" };

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, String(v)));
    Object.entries(extra).forEach(([k, v]) => data.append(k, String(v)));

    // Only send the ID files that match the chosen ID type
    const skip: DocKey[] = extra.idType === "NID" ? ["citizenshipFront", "citizenshipBack"] : ["nationalId"];
    (Object.keys(docs) as DocKey[]).forEach(k => {
        const f = docs[k];
        if (f && !skip.includes(k)) data.append(apiField[k], f, f.name);
    });
    return { data };
};