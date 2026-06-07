import React, { useEffect, useState } from "react";
import axios from "../axios";
import { useWebSocket } from "../Context/WebSocketContext";
import { useToast } from "./Toast";
import { useParams, Link } from "react-router-dom";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { subscribeToOrder } = useWebSocket();
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order) {
      subscribeToOrder(order.id, (updatedOrder) => {
        setOrder(prev => prev ? { ...prev, ...updatedOrder } : null);
        showToast(`Order #${updatedOrder.orderId} status: ${updatedOrder.status}`);
      });
    }
  }, [order, subscribeToOrder]);

  useEffect(() => {
    if (order && order.status) {
      setOrder(prev => {
        if (prev && prev.status === order.status) return prev;
        return prev ? { ...prev, status: order.status } : prev;
      });
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
      showToast("Error fetching order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID": return "success";
      case "PENDING": return "warning";
      case "SHIPPED": return "primary";
      case "DELIVERED": return "info";
      case "FAILED": return "danger";
      case "CANCELLED": return "secondary";
      case "REFUNDED": return "dark";
      default: return "secondary";
    }
  };

  const getStatusStep = (status) => {
    const steps = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
    const currentStep = steps.indexOf(status);
    return steps.map((step, index) => ({
      step: step,
      active: index <= currentStep,
      completed: index < currentStep
    }));
  };

  const getStatusTimeline = () => {
    if (!order?.status) return [];
    return getStatusStep(order.status);
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: "100px", textAlign: "center" }}>
        <h3 style={{ color: '#fffdfdff' }}>Loading order details...</h3>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ marginTop: "100px" }}>
        <div className="alert alert-danger">
          Order not found
        </div>
        <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "80px" }}>
      <button
        onClick={() => window.history.back()}
        className="btn btn-outline-secondary mb-4"
      >
        &larr; Back to Orders
      </button>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h4>Order #{order.id}</h4>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Order Details</h5>
                <span className={`badge bg-${getStatusColor(order.status)} fs-5`}>
                  {order.status}
                </span>
              </div>

              <div className="mb-3">
                <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
                <p><strong>Status:</strong> {order.status}</p>
              </div>

              <h6>Shipping Information</h6>
              <div className="bg-light p-3 rounded mb-3">
                <p><strong>Address:</strong> {order.shippingAddress || "Not provided"}</p>
                <p><strong>Method:</strong> {order.shippingMethod || "Not specified"}</p>
              </div>

              {order.shippingCarrier && (
                <div className="bg-info bg-opacity-10 p-3 rounded mb-3">
                  <p><strong>Carrier:</strong> {order.shippingCarrier}</p>
                </div>
              )}

              <h6>Order Items</h6>
              <div className="list-group">
                {order.orderItems && order.orderItems.map((item, index) => (
                  <div key={index} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="mb-0"><strong>{item.productName}</strong></p>
                        <small className="text-muted">{item.productBrand || ""}</small>
                      </div>
                      <div className="text-end">
                        <p className="mb-0">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                        <p className="mb-0 fw-bold">${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header bg-secondary text-white">
              <h4>Tracking Information</h4>
            </div>
            <div className="card-body">
              {order.status === "SHIPPED" || order.status === "DELIVERED" ? (
                <>
                  <div className="mb-3">
                    <p><strong>Tracking Number:</strong></p>
                    <h4 className="text-break">{order.trackingNumber || "N/A"}</h4>
                  </div>

                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary w-100"
                    >
                      Track Package
                    </a>
                  )}

                  {order.status === "DELIVERED" && (
                    <div className="alert alert-success mt-3 text-center">
                      <strong>Package Delivered!</strong>
                    </div>
                  )}

                  {order.status === "SHIPPED" && (
                    <div className="alert alert-warning mt-3 text-center">
                      <strong>In Transit</strong>
                      <p className="small mb-0">Package is on its way</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted">
                  <p>No tracking information available yet</p>
                  <p>Tracking will be available once the order is SHIPPED</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-dark text-white">
              <h4>Status Timeline</h4>
            </div>
            <div className="card-body">
              <div className="timeline">
                {getStatusTimeline().map((t, index) => (
                  <div key={index} className="timeline-item mb-3">
                    <div className={`timeline-marker ${t.active ? 'bg-primary' : 'bg-secondary'}`}>
                      {t.completed ? (
                        <i className="fas fa-check"></i>
                      ) : (
                        <span className="timeline-number">{index + 1}</span>
                      )}
                    </div>
                    <div className={`timeline-content ${t.active ? 'fw-bold' : 'text-muted'}`}>
                      {t.step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
