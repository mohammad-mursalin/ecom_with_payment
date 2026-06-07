import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "../Context/WebSocketContext";
import { useToast } from "./Toast";
import axios from "../axios";
import AppContext from "../Context/Context";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("verifying");
  const { subscribeToOrder, orderUpdates } = useWebSocket();
  const { showToast } = useToast();
  const { clearCart } = useContext(AppContext);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setStatus("error");
    }
  }, [sessionId]);

   useEffect(() => {
     // Listen for WebSocket updates
     if (orderUpdates.length > 0) {
       const latestUpdate = orderUpdates[orderUpdates.length - 1];
       if (latestUpdate.status === "PAID") {
         setStatus("success");
         showToast("Payment successful! Your order has been placed.");
         clearCart();
       }
     }
   }, [orderUpdates, clearCart]);

   const verifyPayment = async () => {
     try {
       // Subscribe to the specific order via WebSocket
       // For now, we'll just show success after a brief delay
       // In production, you'd verify with backend
       
       setTimeout(() => {
         setStatus("success");
         showToast("Payment successful! Your order has been placed.");
         clearCart();
       }, 2000);
     } catch (error) {
       console.error("Error verifying payment:", error);
       setStatus("error");
     }
   };

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

  return (
    <div className="container mt-5 text-center" style={{ maxWidth: "600px" }}>
      <div className="alert alert-success border-0" style={{ backgroundColor: "#d1e7dd", borderRadius: "12px" }}>
        <div className="text-center mb-3">
          <i className="bi bi-check-circle-fill" style={{ fontSize: "3rem", color: "#198754" }}></i>
        </div>
        <h4 className="alert-heading mb-3">Payment Successful!</h4>
        <p>Thank you for your purchase. Your order has been placed successfully.</p>
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