import React, { useEffect, useState } from "react";
import axios from "../axios";
import { useWebSocket } from "../Context/WebSocketContext";
import { useToast } from "./Toast";
import { Link } from "react-router-dom";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { orderUpdates, subscribeToOrder } = useWebSocket();
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Subscribe to real-time order updates
    orders.forEach(order => {
      subscribeToOrder(order.id, (updatedOrder) => {
        setOrders(prev => prev.map(o => 
          o.id === updatedOrder.orderId ? { ...o, status: updatedOrder.status } : o
        ));
        showToast(`Order #${updatedOrder.orderId} status: ${updatedOrder.status}`);
      });
    });
  }, [orders.length, subscribeToOrder]);

  // Also listen to general order updates
  useEffect(() => {
    if (orderUpdates.length > 0) {
      const latestUpdate = orderUpdates[orderUpdates.length - 1];
      setOrders(prev => prev.map(o => 
        o.id === latestUpdate.orderId ? { ...o, status: latestUpdate.status } : o
      ));
    }
  }, [orderUpdates]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/orders");
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showToast("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID": return "success";
      case "PENDING": return "warning";
      case "FAILED": return "danger";
      case "CANCELLED": return "secondary";
      case "REFUNDED": return "info";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h3 className="text-muted">Loading orders...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "80px" }}>
      <h2 className="mb-4 text-center">Order History</h2>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="bi bi-box-seam" style={{ fontSize: "3rem", color: "#6c757d" }}></i>
          </div>
          <h4>No orders yet</h4>
          <p className="text-muted">Your orders will appear here after purchase.</p>
          <Link to="/" className="btn btn-primary mt-3">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="row">
          {orders.map((order, index) => (
            <div key={order.id} className="col-md-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-receipt"></i>
                    <h5 className="mb-0">Order #{order.id}</h5>
                  </div>
                  <span className={`badge bg-light text-primary`}>
                    {order.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <h6 className="text-muted mb-1">Order Date</h6>
                        <p className="mb-1">
                          <i className="bi bi-calendar3"></i>
                          {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="mb-3">
                        <h6 className="text-muted mb-1">Total Amount</h6>
                        <p className="mb-1 fw-bold" style={{ fontSize: "1.2rem", color: "#0d6efd" }}>
                          <i className="bi bi-currency-rupee"></i>
                          {order.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="mb-3">
                        <h6 className="text-muted mb-1">Customer Email</h6>
                        <p className="mb-0">
                          <i className="bi bi-envelope"></i>
                          {order.customerEmail || "Not provided"}
                        </p>
                      </div>
                      {order.shippingCarrier && (
                        <div className="mb-3">
                          <h6 className="text-muted mb-1">Carrier</h6>
                          <p className="mb-0">
                            <i className="bi bi-truck"></i>
                            {order.shippingCarrier}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <h6 className="mb-3">Order Items</h6>
                      <div className="border rounded p-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
                        {order.orderItems && order.orderItems.map((item, index) => (
                          <div key={index} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: index < order.orderItems.length - 1 ? '1px solid #e9ecef' : 'none' }}>
                            <div>
                              <p className="mb-0 fw-semibold">{item.productName}</p>
                              <small className="text-muted">{item.productBrand || ''}</small>
                            </div>
                            <div className="text-end">
                              <p className="mb-0">{item.quantity} x</p>
                              <p className="mb-0 fw-semibold">
                                <i className="bi bi-currency-rupee"></i>
                                {item.subtotal?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
