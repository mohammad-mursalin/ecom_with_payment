import React, { useState, useEffect } from "react";
import API from "../axios";
import { useToast } from "../components/Toast";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Admin sees all orders via /api/orders (already filtered by backend based on role)
      const response = await API.get("/api/orders");
      setOrders(response.data.data || response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
      showToast("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await API.patch(`/api/orders/${orderId}/status?status=${newStatus}`);
      showToast(`Order #${orderId} status updated to ${newStatus}`);
      // Refresh orders list
      fetchOrders();
    } catch (err) {
      showToast("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <div className="text-center mt-4">Loading orders...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customerEmail}</td>
              <td>${order.totalAmount?.toFixed(2)}</td>
              <td>
                <span className={`badge ${
                  order.status === "PAID" ? "bg-success" :
                  order.status === "PENDING" ? "bg-warning" :
                  order.status === "FAILED" ? "bg-danger" : "bg-secondary"
                }`}>
                  {order.status}
                </span>
              </td>
              <td>{new Date(order.orderDate).toLocaleDateString()}</td>
              <td>
                <div className="dropdown">
                  <button
                    className="btn btn-sm btn-outline-primary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    Update Status
                  </button>
                  <ul className="dropdown-menu">
                    {["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"].map((status) => (
                      <li key={status}>
                        <button
                          className="dropdown-item"
                          onClick={() => handleStatusUpdate(order.id, status)}
                          disabled={order.status === status}
                        >
                          {status}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <p className="text-muted">No orders found.</p>
      )}
    </div>
  );
};

export default AdminOrders;
