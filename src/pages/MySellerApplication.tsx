
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Store,
  CalendarDays,
  FileText,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  sellerApplicationApi,
  type MySellerApplication as Application,
} from "../services/sellerApplicationApi";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const MySellerApplication = () => {
  const [application, setApplication] =
    useState<Application | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadApplication = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setNotFound(false);

    try {
      const result =
        await sellerApplicationApi.getMyApplication();

      setApplication(result);
    } catch (error: any) {
      setApplication(null);

      if (error?.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Could not load your seller application."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-cream">
        <div className="text-center">
          <div className="mx-auto size-9 border-4 border-app-green border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-zinc-500">
            Loading your application...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center bg-app-cream px-4 text-center">
        <div className="size-20 rounded-full bg-orange-100 text-app-orange flex items-center justify-center">
          <Store size={36} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-zinc-900">
          No Seller Application Found
        </h1>

        <p className="mt-2 max-w-md text-sm text-zinc-500">
          There is no seller application linked to your account.
          You can submit a new application to become a Pasalmandu seller.
        </p>

        <Link
          to="/become-seller"
          className="mt-6 rounded-xl bg-app-green px-6 py-3 text-sm font-semibold text-white"
        >
          Apply to Become a Seller
        </Link>
      </div>
    );
  }

  const status = application.status;
  const isPending = status === "Pending";
  const isApproved = status === "Approved";
  const isRejected = status === "Rejected";

  const steps = [
    {
      title: "Application Submitted",
      description: "Your seller application has been received.",
      complete: true,
    },
    {
      title: "Admin Review",
      description: isPending
        ? "Your application is waiting for Admin review."
        : "Your application has been reviewed.",
      complete: !isPending,
    },
    {
      title: isApproved
        ? "Application Approved"
        : isRejected
          ? "Application Rejected"
          : "Final Decision",
      description: isApproved
        ? "Your seller application has been approved."
        : isRejected
          ? "Your seller application was not approved."
          : "Waiting for the Admin decision.",
      complete: isApproved || isRejected,
      rejected: isRejected,
    },
  ];

  const feedback =
    application.rejectionReason || application.adminNote;

  return (
    <div className="min-h-screen bg-app-cream px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-app-green"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>

            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              My Seller Application
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Track your Pasalmandu seller application.
            </p>
          </div>

          <button
            onClick={() => loadApplication(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-app-border bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh Status
          </button>
        </div>

        {/* Application summary */}
        <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Application Reference
              </p>

              <h2 className="mt-2 font-mono text-xl font-bold text-app-green">
                {application.applicationNumber}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Submitted: {formatDate(application.createdAt)}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                statusStyles[status] ??
                "bg-zinc-100 text-zinc-700"
              }`}
            >
              {status}
            </span>
          </div>

          <hr className="my-6 border-zinc-100" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-zinc-500">Store Name</p>
              <p className="mt-1 font-semibold text-zinc-900">
                {application.storeName}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Owner Name</p>
              <p className="mt-1 font-semibold text-zinc-900">
                {application.ownerName}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">
                {application.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Phone</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">
                {application.phone}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Category</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">
                {application.category || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">City</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">
                {application.city || "Not provided"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-zinc-500">Store Address</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">
                {application.address}
              </p>
            </div>
          </div>
        </section>

        {/* Application progress */}
        <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
            <Clock size={20} className="text-app-green" />
            Application Progress
          </h2>

          <div className="mt-6 space-y-6">
            {steps.map((step, index) => (
              <div key={step.title} className="relative flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      step.rejected
                        ? "bg-red-100 text-red-600"
                        : step.complete
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {step.rejected ? (
                      <XCircle size={21} />
                    ) : step.complete ? (
                      <CheckCircle2 size={21} />
                    ) : (
                      <span className="font-bold">{index + 1}</span>
                    )}
                  </div>

                  {index !== steps.length - 1 && (
                    <div
                      className={`mt-2 h-10 w-0.5 ${
                        step.complete
                          ? "bg-green-300"
                          : "bg-zinc-200"
                      }`}
                    />
                  )}
                </div>

                <div className="pb-4">
                  <h3 className="font-semibold text-zinc-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {application.reviewedAt && (
            <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
              <CalendarDays size={14} />
              Reviewed: {formatDate(application.reviewedAt)}
            </p>
          )}
        </section>

        {/* Previous Admin feedback */}
        {isRejected && feedback && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-red-900">
              Admin Review Feedback
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-red-800">
              {feedback}
            </p>
          </section>
        )}

        {/* Submitted documents */}
        <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
            <FileCheck size={20} className="text-app-green" />
            Submitted Documents
          </h2>

          {application.documents.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No documents are recorded for this application.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-zinc-100">
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <FileText size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-800">
                        {doc.label}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>

                  <CheckCircle2
                    size={19}
                    className="shrink-0 text-green-600"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending status */}
        {isPending && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="font-bold text-amber-900">
              Your application is being processed
            </h3>

            <p className="mt-1 text-sm text-amber-800">
              Your application is pending Admin review. You can
              refresh this page to check for status updates.
            </p>
          </div>
        )}

        {/* Approved status */}
        {isApproved && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <h3 className="font-bold text-green-900">
              Congratulations! Your application is approved.
            </h3>

            <p className="mt-1 text-sm text-green-800">
              Your vendor account has been approved. You can
              access your Vendor Dashboard.
            </p>

            <Link
              to="/vendor"
              className="mt-4 inline-block rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Open Vendor Dashboard
            </Link>
          </div>
        )}

        {/* Rejected status with correction option */}
        {isRejected && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle size={22} />
              </div>

              <div>
                <h3 className="font-bold text-red-900">
                  Your application was rejected.
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-red-800">
                  Please review the Admin feedback, correct the
                  required information or documents, and resubmit
                  your existing application.
                </p>
              </div>
            </div>

            <Link
              to="/my-seller-application/resubmit"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-app-green px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <RefreshCw size={17} />
              Fix & Resubmit
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySellerApplication;
