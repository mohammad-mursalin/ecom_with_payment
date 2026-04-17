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
    <div className="container" style={{ marginTop: "100px", textAlign: "center" }}>
      <div className="alert alert-warning" role="alert">
        <h4 className="alert-heading">Payment Cancelled</h4>
        <p>Your payment was cancelled and your order has not been placed.</p>
        <hr />
        <p className="mb-0">Your cart items are still saved. You can try again when you're ready.</p>
      </div>
      <div className="mt-4">
        <button className="btn btn-primary me-2" onClick={() => navigate("/cart")}>
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
