import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { goToPayment, shopApi, shopError, type PaymentResult as Result } from "../services/shopApi";

// eSewa and Khalti send the customer back here after paying (or giving up).
//   eSewa success: /payment/esewa?data=<base64>        eSewa failure: /payment/esewa?failed=1&order=PSM-...
//   Khalti:        /payment/khalti?pidx=...&status=...&purchase_order_id=PSM-...
// We never trust the address bar alone: the API asks the wallet whether the money really arrived.
type View = "checking" | "paid" | "notPaid" | "error";

const PaymentResult = () => {
    const { provider } = useParams<{ provider: string }>();
    const [params] = useSearchParams();
    const wallet = provider === "khalti" ? "khalti" : "esewa";
    const walletName = wallet === "esewa" ? "eSewa" : "Khalti";

    const [view, setView] = useState<View>("checking");
    const [message, setMessage] = useState("");
    const [orderNumber, setOrderNumber] = useState(params.get("order") || params.get("purchase_order_id") || "");
    const [busy, setBusy] = useState(false);
    const started = useRef(false);

    const verify = useCallback(async () => {
        setView("checking");
        try {
            let r: Result;
            if (wallet === "esewa") {
                const data = params.get("data");
                if (!data || params.get("failed")) {
                    setView("notPaid");
                    setMessage("The eSewa payment was cancelled or did not go through.");
                    return;
                }
                r = await shopApi.esewaVerify(data);
            } else {
                const pidx = params.get("pidx");
                if (!pidx) {
                    setView("notPaid");
                    setMessage("Khalti did not return a payment reference.");
                    return;
                }
                r = await shopApi.khaltiVerify(pidx);
            }
            setOrderNumber(r.orderNumber);
            setMessage(r.message);
            setView(r.paid ? "paid" : "notPaid");
        } catch (err) {
            setMessage(shopError(err, "We could not confirm the payment."));
            setView("error");
        }
    }, [params, wallet]);

    // Run once (React StrictMode would otherwise call it twice in development)
    useEffect(() => {
        if (started.current) return;
        started.current = true;
        void verify();
    }, [verify]);

    const payAgain = async () => {
        if (!orderNumber) return;
        setBusy(true);
        try {
            await goToPayment(orderNumber, wallet);
        } catch (err) {
            toast.error(shopError(err, "Could not open the payment page"));
            setBusy(false);
        }
    };

    const cancelOrder = async () => {
        if (!orderNumber || !confirm("Cancel this order?")) return;
        setBusy(true);
        try {
            await shopApi.cancelOrder(orderNumber);
            toast.success("Order cancelled");
            setView("notPaid");
            setMessage("The order was cancelled. Nothing was charged.");
            setOrderNumber("");
        } catch (err) {
            toast.error(shopError(err, "Could not cancel the order"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-[70vh] bg-app-cream flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-3xl border border-app-border shadow-sm p-8 text-center space-y-4">
                {view === "checking" && (
                    <>
                        <Loader2 className="size-12 text-app-green animate-spin mx-auto" />
                        <h1 className="text-xl font-bold text-zinc-900">Confirming your {walletName} payment...</h1>
                        <p className="text-sm text-zinc-500">Please don't close this page.</p>
                    </>
                )}

                {view === "paid" && (
                    <>
                        <CheckCircle2 className="size-14 text-emerald-600 mx-auto" />
                        <h1 className="text-2xl font-bold text-zinc-900">Payment successful</h1>
                        <p className="text-sm text-zinc-600">{message} Your order <span className="font-mono font-semibold">#{orderNumber}</span> is confirmed.</p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                            <Link to={`/orders/${orderNumber}`} className="px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl">Track my order</Link>
                            <Link to="/products" className="px-5 py-2.5 border border-app-border text-sm font-semibold rounded-xl text-zinc-700">Continue shopping</Link>
                        </div>
                    </>
                )}

                {(view === "notPaid" || view === "error") && (
                    <>
                        {view === "error" ? <Clock className="size-14 text-amber-500 mx-auto" /> : <XCircle className="size-14 text-red-500 mx-auto" />}
                        <h1 className="text-2xl font-bold text-zinc-900">{view === "error" ? "Payment not confirmed yet" : "Payment not completed"}</h1>
                        <p className="text-sm text-zinc-600">{message}</p>
                        {orderNumber && <p className="text-xs text-zinc-500">Order <span className="font-mono">#{orderNumber}</span> is waiting for payment for up to 30 minutes.</p>}
                        <div className="flex flex-col gap-2 pt-2">
                            {view === "error" && (
                                <button onClick={() => void verify()} className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl">Check again</button>
                            )}
                            {orderNumber && (
                                <button onClick={() => void payAgain()} disabled={busy} className="px-5 py-2.5 bg-app-green text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                                    {busy ? "Opening..." : `Try paying with ${walletName} again`}
                                </button>
                            )}
                            {orderNumber && (
                                <button onClick={() => void cancelOrder()} disabled={busy} className="px-5 py-2.5 text-red-600 border border-red-200 text-sm font-semibold rounded-xl disabled:opacity-60">
                                    Cancel this order
                                </button>
                            )}
                            <Link to="/orders" className="text-sm text-zinc-500 underline pt-1">Go to my orders</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentResult;
