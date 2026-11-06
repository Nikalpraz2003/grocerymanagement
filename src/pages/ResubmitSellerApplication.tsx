
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileUp, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  sellerApplicationApi,
  type SellerApplicationEdit,
} from "../services/sellerApplicationApi";

type DocumentType =
  | "CitizenshipFront"
  | "CitizenshipBack"
  | "NationalId"
  | "PanCertificate"
  | "BusinessRegistration"
  | "ShopPhoto"
  | "OwnerPhoto";

type FormFields = Omit<SellerApplicationEdit, "documents">;

const ResubmitSellerApplication = () => {
  const navigate = useNavigate();

  const [application, setApplication] =
    useState<FormFields | null>(null);

  const [documents, setDocuments] = useState<
    SellerApplicationEdit["documents"]
  >([]);

  const [files, setFiles] = useState<
    Partial<Record<DocumentType, File>>
  >({});

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const result =
          await sellerApplicationApi.getMyApplicationForEdit();

        if (result.status !== "Rejected") {
          toast.error("Only rejected applications can be corrected.");
          navigate("/my-seller-application");
          return;
        }

        const { documents: existingDocuments, ...details } = result;

        setApplication(details);
        setDocuments(existingDocuments);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Could not load your application."
        );
        navigate("/my-seller-application");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const updateField = (field: keyof FormFields, value: string | boolean) => {
    setApplication((current) =>
      current ? { ...current, [field]: value } : current
    );
  };

  const handleFileChange =
    (type: DocumentType) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) {
        setFiles((current) => ({
          ...current,
          [type]: file,
        }));
      }
    };

  const hasDocument = (type: DocumentType) =>
    documents.some((document) => document.type === type);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!application) return;

    if (!agreed) {
      toast.error("Please accept the seller terms before resubmitting.");
      return;
    }

    const data = new FormData();

    data.append("AgreedToTerms", "true");

    data.append("StoreName", application.storeName);
    data.append("Description", application.description);
    data.append("OwnerName", application.ownerName);
    data.append("Phone", application.phone);
    data.append("Category", application.category);
    data.append("City", application.city);
    data.append("Address", application.address);

    data.append("HasPanVat", application.hasPanVat ? "yes" : "no");
    data.append("DailyCapacity", application.dailyCapacity);

    data.append("IdType", application.idType);
    data.append("IdNumber", application.idNumber);
    data.append("PanNumber", application.panNumber);
    data.append("BusinessRegNumber", application.businessRegNumber);

    data.append("BankName", application.bankName);
    data.append("BankAccountName", application.bankAccountName);
    data.append("BankAccountNumber", application.bankAccountNumber);
    data.append("BankBranch", application.bankBranch);

    Object.entries(files).forEach(([type, file]) => {
      if (file) {
        data.append(type, file);
      }
    });

    setSubmitting(true);

    try {
      await sellerApplicationApi.resubmitApplication(data);

      toast.success("Your corrected application was submitted successfully.");

      navigate("/my-seller-application");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Could not resubmit your application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-app-cream">
        <Loader2 className="animate-spin text-app-green" size={32} />
      </div>
    );
  }

  const documentFields: {
    type: DocumentType;
    label: string;
    required: boolean;
    visible: boolean;
  }[] = [
    {
      type: "ShopPhoto",
      label: "Shop Photo",
      required: true,
      visible: true,
    },
    {
      type: "CitizenshipFront",
      label: "Citizenship Front",
      required: true,
      visible: application.idType !== "NID",
    },
    {
      type: "CitizenshipBack",
      label: "Citizenship Back",
      required: true,
      visible: application.idType !== "NID",
    },
    {
      type: "NationalId",
      label: "National ID",
      required: true,
      visible: application.idType === "NID",
    },
    {
      type: "PanCertificate",
      label: "PAN / VAT Certificate",
      required: true,
      visible: application.hasPanVat,
    },
    {
      type: "BusinessRegistration",
      label: "Business Registration",
      required: false,
      visible: true,
    },
    {
      type: "OwnerPhoto",
      label: "Owner Photo",
      required: false,
      visible: true,
    },
  ];

  return (
    <div className="min-h-screen bg-app-cream px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">

        <Link
          to="/my-seller-application"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-app-green"
        >
          <ArrowLeft size={16} />
          Back to My Application
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Correct Your Seller Application
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Application reference:{" "}
            <strong>{application.applicationNumber}</strong>
          </p>
        </div>

        {(application.rejectionReason || application.adminNote) && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-900">
              Previous Admin Feedback
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-red-800">
              {application.rejectionReason || application.adminNote}
            </p>
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Store information */}
          <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-zinc-900">
              Store Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Store Name"
                value={application.storeName}
                required
                onChange={(v) => updateField("storeName", v)}
              />

              <Field
                label="Owner Name"
                value={application.ownerName}
                required
                onChange={(v) => updateField("ownerName", v)}
              />

              <Field
                label="Phone"
                value={application.phone}
                required
                onChange={(v) => updateField("phone", v)}
              />

              <Field
                label="Email"
                value={application.email}
                disabled
              />

              <Field
                label="Category"
                value={application.category}
                onChange={(v) => updateField("category", v)}
              />

              <Field
                label="City"
                value={application.city}
                onChange={(v) => updateField("city", v)}
              />

              <div className="sm:col-span-2">
                <Field
                  label="Store Description"
                  value={application.description}
                  onChange={(v) => updateField("description", v)}
                />
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="Store Address"
                  value={application.address}
                  required
                  onChange={(v) => updateField("address", v)}
                />
              </div>

              <Field
                label="Daily Capacity"
                value={application.dailyCapacity}
                onChange={(v) => updateField("dailyCapacity", v)}
              />
            </div>
          </section>

          {/* Identity and business information */}
          <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-zinc-900">
              Identity and Business Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Identity Document Type
                </label>
                <select
                  value={application.idType}
                  onChange={(e) => updateField("idType", e.target.value)}
                  className="w-full rounded-xl border border-app-border bg-white px-3 py-3 text-sm"
                >
                  <option value="Citizenship">Citizenship</option>
                  <option value="NID">National ID</option>
                </select>
              </div>

              <Field
                label="Identity Number"
                value={application.idNumber}
                required
                onChange={(v) => updateField("idNumber", v)}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Do you have PAN / VAT?
                </label>
                <select
                  value={application.hasPanVat ? "yes" : "no"}
                  onChange={(e) =>
                    updateField("hasPanVat", e.target.value === "yes")
                  }
                  className="w-full rounded-xl border border-app-border bg-white px-3 py-3 text-sm"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              {application.hasPanVat && (
                <Field
                  label="PAN / VAT Number"
                  value={application.panNumber}
                  required
                  onChange={(v) => updateField("panNumber", v)}
                />
              )}

              <Field
                label="Business Registration Number"
                value={application.businessRegNumber}
                onChange={(v) => updateField("businessRegNumber", v)}
              />
            </div>
          </section>

          {/* Bank information */}
          <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-zinc-900">
              Bank Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Bank Name"
                value={application.bankName}
                onChange={(v) => updateField("bankName", v)}
              />

              <Field
                label="Account Holder Name"
                value={application.bankAccountName}
                onChange={(v) => updateField("bankAccountName", v)}
              />

              <Field
                label="Bank Account Number"
                value={application.bankAccountNumber}
                onChange={(v) => updateField("bankAccountNumber", v)}
              />

              <Field
                label="Bank Branch"
                value={application.bankBranch}
                onChange={(v) => updateField("bankBranch", v)}
              />
            </div>
          </section>

          {/* Documents */}
          <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-2 text-lg font-bold text-zinc-900">
              Documents
            </h2>

            <p className="mb-5 text-sm text-zinc-500">
              Your current documents are retained. Select a new file only
              when you want to replace an existing document or upload a
              missing one.
            </p>

            <div className="space-y-5">
              {documentFields
                .filter((field) => field.visible)
                .map((field) => {
                  const existing = documents.find(
                    (doc) => doc.type === field.type
                  );

                  return (
                    <div
                      key={field.type}
                      className="rounded-xl border border-app-border p-4"
                    >
                      <label className="block text-sm font-semibold text-zinc-800">
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </label>

                      {existing && (
                        <p className="mt-2 text-xs text-green-700">
                          Current document: {existing.fileName}
                        </p>
                      )}

                      {!existing && field.required && (
                        <p className="mt-2 text-xs text-amber-700">
                          No current document. Please upload one.
                        </p>
                      )}

                      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-app-border p-3 text-sm text-zinc-600 hover:bg-zinc-50">
                        <FileUp size={18} />
                        <span>
                          {files[field.type]?.name ||
                            "Choose a file to upload or replace"}
                        </span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          required={field.required && !existing}
                          className="hidden"
                          onChange={handleFileChange(field.type)}
                        />
                      </label>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Terms */}
          <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm">
            <label className="flex items-start gap-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
              />
              <span>
                I confirm that the updated information and documents are
                accurate, and I agree to the seller terms.
              </span>
            </label>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              to="/my-seller-application"
              className="rounded-xl border border-app-border bg-white px-5 py-3 text-sm font-semibold text-zinc-700"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || !agreed}
              className="inline-flex items-center gap-2 rounded-xl bg-app-green px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <Loader2 size={17} className="animate-spin" />
              )}
              {submitting ? "Submitting..." : "Submit Corrected Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

type FieldProps = {
  label: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

const Field = ({
  label,
  value,
  required = false,
  disabled = false,
  onChange,
}: FieldProps) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-zinc-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>

    <input
      type="text"
      value={value ?? ""}
      required={required}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-xl border border-app-border bg-white px-3 py-3 text-sm outline-none focus:border-app-green disabled:bg-zinc-100"
    />
  </div>
);

export default ResubmitSellerApplication;
