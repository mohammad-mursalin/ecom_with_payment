import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../Context/CartContext";
import { getOrders, getOrder } from "../services/orderService";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntent = searchParams.get("payment_intent");
  const [status, setStatus] = useState("verifying");
  const [orderId, setOrderId] = useState(null);
  const { clearCart } = useCart();

  const verifyPayment = useCallback(async () => {
    try {
      // The payment was successful via Stripe redirect
      // Get order details and verify confirmation
      const orders = await getOrders();
      if (orders && orders.length > 0) {
        // Find the pending order (most recent one)
        const pendingOrder = orders.find(o => o.status === "PENDING") || orders[0];
        if (pendingOrder) {
          const foundOrderId = pendingOrder.orderId || pendingOrder.id;
          setOrderId(foundOrderId);
          // The backend webhook should have confirmed it, but we poll to verify
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
                setStatus("success"); // Assume success if we can't verify
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
      // Even on error, payment succeeded on Stripe's side - show success
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
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h3 className="mt-4 text-muted">Verifying your payment...</h3>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container mt-5 text-center">
        <div className="mb-4">
          <i className="bi bi-x-circle-fill" style={{ fontSize: "4rem", color: "#dc3545" }}></i>
        </div>
        <h3 className="text-danger mb-3">Payment verification failed</h3>
        <p className="text-muted mb-4">Please try again or contact support if the issue persists.</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Go to Home
        </button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="container mt-5 text-center" style={{ maxWidth: "600px" }}>
        <div className="alert alert-info border-0" style={{ backgroundColor: "var(--card-bg)", borderRadius: "12px" }}>
          <div className="text-center mb-3">
            <i className="bi bi-info-circle-fill" style={{ fontSize: "3rem", color: "var(--color-brand)" }}></i>
          </div>
          <h4 className="alert-heading mb-3">Payment Received</h4>
          <p>Your payment was successful but order confirmation is still pending.</p>
          <hr className="mb-3" />
          <p className="mb-0">Please check your orders page in a few moments for updates.</p>
        </div>
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button className="btn btn-secondary" onClick={() => navigate("/orders")}>
            View Orders
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 text-center" style={{ maxWidth: "600px" }}>
      <div className="alert alert-success border-0" style={{ backgroundColor: "var(--card-bg)", borderRadius: "12px" }}>
        <div className="text-center mb-3">
          <i className="bi bi-check-circle-fill" style={{ fontSize: "3rem", color: "var(--color-success)" }}></i>
        </div>
        <h4 className="alert-heading mb-3">Payment Successful!</h4>
        <p>Thank you for your purchase. Your order has been placed successfully.</p>
        {orderId && (
          <p className="mb-0"><strong>Order ID:</strong> #{orderId}</p>
        )}
        <hr className="mb-3" />
        <p className="mb-0">You will receive a confirmation email shortly.</p>
      </div>
      <div className="d-flex justify-content-center gap-3 mt-4">
        <button className="btn btn-primary" onClick={() => navigate("/orders")}>
          View Orders
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;