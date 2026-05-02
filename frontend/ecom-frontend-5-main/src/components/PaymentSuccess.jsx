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
      <div className="container" style={{ marginTop: "100px", textAlign: "center" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h3 className="mt-3">Verifying your payment...</h3>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container" style={{ marginTop: "100px", textAlign: "center" }}>
        <h3 className="text-danger">Payment verification failed</h3>
        <p>Please contact support or try again.</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "100px", textAlign: "center" }}>
      <div 
        className="alert alert-success" 
        role="alert"
        style={{
          color: '#0f5132',
          backgroundColor: '#d1e7dd',
          borderColor: '#badbcc',
          maxWidth: '600px',
          margin: '0 auto 20px auto'
        }}
      >
        <h4 className="alert-heading">Payment Successful!</h4>
        <p>Thank you for your purchase. Your order has been placed successfully.</p>
        <hr />
        <p className="mb-0">You will receive a confirmation email shortly.</p>
      </div>
      <div className="mt-4">
        <button className="btn btn-primary me-2" onClick={() => navigate("/orders")}>
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