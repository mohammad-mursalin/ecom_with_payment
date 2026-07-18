import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Toast";
import { XCircle } from "lucide-react";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    toast.info("Payment was cancelled. Your order has not been placed.");
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-4 rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
        <XCircle className="mb-4 mx-auto h-12 w-12 text-warning" />
        <h3 className="mb-3 text-center text-2xl font-bold text-primary">Payment Cancelled</h3>
        <p className="text-center text-sm text-secondary">Your payment was cancelled and your order has not been placed.</p>
        <p className="mt-3 text-center text-sm text-muted">Your cart items are still saved. You can try again when you&apos;re ready.</p>
      </div>
      <div className="flex gap-3">
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover dark:shadow-none" onClick={() => navigate("/cart")}>
          Try Again
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;
