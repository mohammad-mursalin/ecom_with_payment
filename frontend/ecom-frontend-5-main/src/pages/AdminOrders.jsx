import React, { useState, useEffect } from "react";
import API from "../axios";
import { useToast } from "../components/Toast";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: "",
    trackingUrl: "",
    shippingCarrier: ""
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (showTrackingModal && selectedOrder) {
      setTrackingForm({
        trackingNumber: selectedOrder.trackingNumber || "",
        trackingUrl: selectedOrder.trackingUrl || "",
        shippingCarrier: selectedOrder.shippingCarrier || ""
      });
    }
  }, [showTrackingModal, selectedOrder]);

  const fetchOrders = async () => {
    try {
      // Admin sees all orders via /api/orders (already filtered by backend based on role)
      const response = await API.get("/orders");
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
      await API.patch(`/orders/${orderId}/status?status=${newStatus}`);
      showToast(`Order #${orderId} status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      showToast("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenTrackingModal = (order) => {
    setSelectedOrder(order);
    setShowTrackingModal(true);
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await API.patch(`/orders/${selectedOrder.id}/tracking`, trackingForm);
      showToast(`Tracking updated for Order #${selectedOrder.id}`);
      setShowTrackingModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      showToast("Failed to update tracking: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container" style={{ marginTop: "80px", marginBottom: "40px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Admin Order Management</h2>
          <div className="badge bg-info">
            {orders.length} Order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="bi bi-box-seam" style={{ fontSize: "3rem", color: "#6c757d" }}></i>
            </div>
            <h4>No orders found</h4>
            <p className="text-muted">There are no orders to manage yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="fw-semibold">{order.id}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                             style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                          {order.customerEmail?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="fw-semibold small">{order.customerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold">
                        <i className="bi bi-currency-rupee"></i>
                        {order.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        order.status === "PAID" ? "bg-success" :
                        order.status === "PENDING" ? "bg-warning text-dark" :
                        order.status === "SHIPPED" ? "bg-primary" :
                        order.status === "DELIVERED" ? "bg-info" :
                        order.status === "FAILED" ? "bg-danger" : "bg-secondary"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <small>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "N/A"}</small>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-primary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            Update Status
                          </button>
                          <ul className="dropdown-menu">
                            {["PENDING", "PAID", "SHIPPED", "DELIVERED", "FAILED", "CANCELLED", "REFUNDED"].map((status) => (
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

                        {(order.status === "SHIPPED" || order.status === "DELIVERED") && (order.trackingNumber || order.trackingUrl) && (
                          <a
                            href={order.trackingUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-success"
                          >
                            <i className="bi bi-truck"></i> Track
                          </a>
                        )}

                        {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleOpenTrackingModal(order)}
                          >
                            <i className="bi bi-pencil-square"></i> Edit Tracking
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        show={showTrackingModal}
        onHide={() => setShowTrackingModal(false)}
        size="lg"
        centered
        backdrop="static"
        keyboard={false}
      >
      <Modal.Header closeButton>
        <Modal.Title>Update Tracking Information</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleUpdateTracking}>
          <Form.Group className="mb-3">
            <Form.Label>Tracking Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., 1234567890"
              value={trackingForm.trackingNumber}
              onChange={(e) => setTrackingForm({...trackingForm, trackingNumber: e.target.value})}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Shipping Carrier</Form.Label>
            <Form.Select
              value={trackingForm.shippingCarrier}
              onChange={(e) => setTrackingForm({...trackingForm, shippingCarrier: e.target.value})}
            >
              <option value="">Select Carrier</option>
              <option value="FedEx">FedEx</option>
              <option value="UPS">UPS</option>
              <option value="DHL">DHL</option>
              <option value="USPS">USPS</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tracking URL (Optional)</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://www.fedex.com/track"
              value={trackingForm.trackingUrl}
              onChange={(e) => setTrackingForm({...trackingForm, trackingUrl: e.target.value})}
            />
            <Form.Text className="text-muted">
              Enter the carrier's tracking URL for easy access
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => setShowTrackingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Tracking
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
    </>
  );
};

export default AdminOrders;
