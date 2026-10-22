import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/authServices";

// Product photo picker: upload from the computer/phone, or (optional) paste a link.
// value / onChange hold the final image address that gets saved with the product.
const MAX_MB = 5;

const ImageUpload = ({ value, onChange, inputClassName = "" }: {
    value: string;
    onChange: (url: string) => void;
    inputClassName?: string;
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [showLink, setShowLink] = useState(false);
    const [broken, setBroken] = useState(false);

    const upload = async (file: File) => {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast.error("Please choose a JPG, PNG or WEBP photo."); return; }
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`The photo is larger than ${MAX_MB} MB.`); return; }
        const fd = new FormData();
        fd.append("file", file);
        setUploading(true);
        try {
            const res = (await api.post("/api/uploads/product-image", fd, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 120000,
            })) as unknown as { url: string };
            setBroken(false);
            onChange(res.url);
            toast.success("Photo uploaded");
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message || "Could not upload the photo");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-start gap-3">
                {/* Preview / drop area */}
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void upload(f); }}
                    disabled={uploading}
                    className="size-28 shrink-0 border-2 border-dashed border-[#d9d4cb] bg-white hover:border-[#e66f43] flex items-center justify-center overflow-hidden"
                    title="Upload a photo"
                >
                    {uploading ? <Loader2 className="size-6 animate-spin text-[#9a948a]" />
                        : value && !broken ? <img src={value} alt="" onError={() => setBroken(true)} className="w-full h-full object-cover" />
                        : <ImagePlus className="size-7 text-[#9a948a]" />}
                </button>

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                            className="px-3 py-2 text-xs font-semibold bg-[#202b23] text-white hover:bg-[#2f3d33] disabled:opacity-60">
                            {uploading ? "Uploading..." : value ? "Change photo" : "Upload photo"}
                        </button>
                        {value && (
                            <button type="button" onClick={() => { onChange(""); setBroken(false); }}
                                className="px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 inline-flex items-center gap-1">
                                <Trash2 size={13} /> Remove
                            </button>
                        )}
                        <button type="button" onClick={() => setShowLink(s => !s)}
                            className="px-3 py-2 text-xs font-semibold text-[#5f5a52] border border-[#d9d4cb] hover:bg-[#f0ece4] inline-flex items-center gap-1">
                            <Link2 size={13} /> {showLink ? "Hide link" : "Use a link instead"}
                        </button>
                    </div>
                    <p className="text-[11px] text-[#9a948a]">JPG, PNG or WEBP, up to {MAX_MB} MB. You can also drag a photo onto the box.</p>
                    {broken && value && <p className="text-[11px] text-red-600">This picture can't be loaded. Upload it again or check the link.</p>}
                    {showLink && (
                        <input value={value} onChange={(e) => { setBroken(false); onChange(e.target.value.trim()); }}
                            className={inputClassName} placeholder="https://... (optional)" />
                    )}
                </div>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        </div>
    );
};

export default ImageUpload;