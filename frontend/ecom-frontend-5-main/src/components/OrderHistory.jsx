import React, { useEffect, useState } from "react";
import axios from "../axios";
import { useWebSocket } from "../Context/WebSocketContext";
import { useToast } from "./Toast";
import { Link, ArrowLeft, Package, Calendar, CreditCard, MapPin, Truck, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { orderUpdates, subscribeToOrder } = useWebSocket();
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    orders.forEach(order => {
      subscribeToOrder(order.id, (updatedOrder) => {
        setOrders(prev => prev.map(o =>
          o.id === updatedOrder.orderId ? { ...o, status: updatedOrder.status } : o
        ));
        showToast(`Order #${updatedOrder.orderId} status: ${updatedOrder.status}`);
      });
    });
  }, [orders.length, subscribeToOrder]);

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
      case "PAID": return { bg: "bg-green-100", text: "text-green-700", border: "border-green-500", icon: CheckCircle };
      case "PENDING": return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-500", icon: Clock };
      case "SHIPPED": return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-500", icon: Truck };
      case "DELIVERED": return { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-500", icon: CheckCircle };
      case "CANCELLED": return { bg: "bg-red-100", text: "text-red-700", border: "border-red-500", icon: XCircle };
      default: return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-500", icon: AlertCircle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="empty-state">
          <Package className="empty-state-icon text-blue-600" />
          <h2 className="empty-state-title">Loading orders...</h2>
          <p className="empty-state-description">Please wait while we fetch your order history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="page-header">
          <div>
            <h1 className="page-title">Order History</h1>
            <p className="page-subtitle">Track and manage your recent orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-state-icon text-blue-600" />
            <h2 className="empty-state-title">No orders yet</h2>
            <p className="empty-state-description">
              Your orders will appear here after purchase. Start shopping to see your orders!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              as={Link}
              to="/"
              className="btn btn-modern btn-modern-primary"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Start Shopping
            </motion.button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const statusConfig = getStatusColor(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="order-card"
                >
                  <div className="order-card-header">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Order #{order.id}</h3>
                        <p className="text-blue-100 text-sm">
                          {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text} font-semibold flex items-center gap-2`}>
                      <StatusIcon className="w-4 h-4" />
                      {order.status}
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--muted)' }}>
                          <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="font-bold text-xl text-blue-600">
                              ₹{order.totalAmount?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--muted)' }}>
                          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Shipping Address</p>
                            <p className="font-semibold text-sm">
                              {order.shippingAddress || 'Address not provided'}
                            </p>
                          </div>
                        </div>

                        {order.shippingCarrier && (
                          <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--muted)' }}>
                            <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Carrier</p>
                              <p className="font-semibold text-sm">{order.shippingCarrier}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          Order Items
                        </h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                          {order.orderItems && order.orderItems.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-all">
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.productBrand || ''}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-blue-600">
                                    {item.quantity} x ₹{item.subtotal?.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OrderHistory;