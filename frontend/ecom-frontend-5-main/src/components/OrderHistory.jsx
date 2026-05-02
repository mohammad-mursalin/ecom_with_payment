import React, { useEffect, useState } from "react";
import axios from "../axios";
import { useWebSocket } from "../Context/WebSocketContext";
import { useToast } from "./Toast";

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
      <div className="container" style={{ marginTop: "100px", textAlign: "center" }}>
        <h3>Loading orders...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "80px" }}>
      <h2 className="mb-4" style={{ color: '#886565ff' }}>Order History</h2>

      {orders.length === 0 ? (
        <div className="text-center mt-5">
          <h4>No orders yet</h4>
          <p>Your orders will appear here after purchase.</p>
        </div>
      ) : (
        <div className="row">
          {orders.map((order) => (
            <div key={order.id} className="col-md-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>Order #{order.id}</span>
                  <span className={`badge bg-${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                      <p><strong>Total:</strong> ${order.totalAmount}</p>
                      <p><strong>Email:</strong> {order.customerEmail || "Not provided"}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Items:</h6>
                      <ul className="list-unstyled">
                        {order.orderItems && order.orderItems.map((item, index) => (
                          <li key={index} className="mb-2">
                            {item.productName} x {item.quantity} - ${item.subtotal}
                          </li>
                        ))}
                      </ul>
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
