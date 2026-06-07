import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "./Toast";

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");
  const { showToast } = useToast();

  useEffect(() => {
    showToast("Payment was cancelled. Your order has not been placed.");
  }, []);

  return (
    <div className="container mt-5 text-center" style={{ maxWidth: "600px" }}>
      <div className="alert alert-warning border-0" style={{ backgroundColor: "#fff3cd", borderRadius: "12px" }}>
        <div className="text-center mb-3">
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "3rem", color: "#ffc107" }}></i>
        </div>
        <h4 className="alert-heading mb-3">Payment Cancelled</h4>
        <p>Your payment was cancelled and your order has not been placed.</p>
        <hr className="mb-3" />
        <p className="mb-0">Your cart items are still saved. You can try again when you're ready.</p>
      </div>
      <div className="d-flex justify-content-center gap-3 mt-4">
        <button className="btn btn-primary" onClick={() => navigate("/cart")}>
          Try Again
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;
