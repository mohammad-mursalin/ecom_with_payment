import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../Context/CartContext";
import { getOrders, getOrder } from "../services/orderService";
import { Loader2, XCircle, Info, CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntent = searchParams.get("payment_intent");
  const [status, setStatus] = useState("verifying");
  const [orderId, setOrderId] = useState(null);
  const { clearCart } = useCart();

  const verifyPayment = useCallback(async () => {
    try {
      const orders = await getOrders();
      if (orders && orders.length > 0) {
        const pendingOrder = orders.find(o => o.status === "PENDING") || orders[0];
        if (pendingOrder) {
          const foundOrderId = pendingOrder.orderId || pendingOrder.id;
          setOrderId(foundOrderId);
          const maxAttempts = 10;
          let attempts = 0;
          const checkOrderStatus = async () => {
            attempts++;
            try {
              const orderData = await getOrder(foundOrderId);
              if (orderData?.status === "CONFIRMED") {
                clearCart();
                setStatus("success");
              } else if (attempts < maxAttempts) {
                setTimeout(checkOrderStatus, 1000);
              } else {
                setStatus("pending");
              }
            } catch {
              if (attempts < maxAttempts) {
                setTimeout(checkOrderStatus, 1000);
              } else {
                setStatus("success");
              }
            }
          };
          checkOrderStatus();
        } else {
          setStatus("success");
        }
      } else {
        setStatus("success");
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error verifying payment:", error);
      setStatus("success");
    }
  }, [clearCart]);

  useEffect(() => {
    if (paymentIntent) {
      verifyPayment();
    } else {
      setStatus("error");
    }
  }, [paymentIntent, verifyPayment]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-secondary">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <XCircle className="mb-4 h-16 w-16 text-danger" />
        <h3 className="mb-3 text-2xl font-bold text-danger">Payment verification failed</h3>
        <p className="mb-4 text-center text-sm text-secondary">
          Please try again or contact support if the issue persists.
        </p>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover dark:shadow-none" onClick={() => navigate("/")}>
          Go to Home
        </button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="mb-4 rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
          <Info className="mb-4 mx-auto h-12 w-12 text-primary" />
          <h3 className="mb-3 text-center text-2xl font-bold text-primary">Payment Received</h3>
          <p className="text-center text-sm text-secondary">
            Your payment was successful but order confirmation is still pending.
          </p>
          <p className="mt-3 text-center text-sm text-muted">Please check your orders page in a few moments for updates.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated" onClick={() => navigate("/orders")}>
            View Orders
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover dark:shadow-none" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
        <CheckCircle className="mx-auto h-16 w-16 text-success" />
        <h2 className="mt-4 text-center text-2xl font-bold text-primary">Payment Successful!</h2>
        <p className="mt-2 text-center text-sm text-secondary">Thank you for your purchase. Your order has been placed successfully.</p>
        {orderId && (
          <p className="mt-3 text-center text-sm"><strong className="text-primary">Order ID:</strong> #{orderId}</p>
        )}
        <p className="mt-3 text-center text-sm text-muted">You will receive a confirmation email shortly.</p>
      </div>
      <div className="mt-6 flex gap-3">
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated" onClick={() => navigate("/orders")}>
          View Orders
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover dark:shadow-none" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;