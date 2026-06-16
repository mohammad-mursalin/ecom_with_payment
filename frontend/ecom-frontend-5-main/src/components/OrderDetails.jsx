import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useToast } from "../components/Toast";
import { getOrder, cancelOrder } from "../services/orderService";
import {
  MapPin, Truck, CheckCircle2, Copy, Check, XCircle, Clock,
  Undo2, Loader2, Package
} from "lucide-react";
import { motion } from "framer-motion";
import OrderCardSkeleton from "./OrderCardSkeleton";
import ErrorState from "./ErrorState";

const STATUS_CONFIG = {
  PENDING: { color: "bg-yellow-100 text-yellow-700 border-yellow-500", icon: Clock },
  CONFIRMED: { color: "bg-blue-100 text-blue-700 border-blue-500", icon: CheckCircle2 },
  SHIPPED: { color: "bg-purple-100 text-purple-700 border-purple-500", icon: Truck },
  DELIVERED: { color: "bg-green-100 text-green-700 border-green-500", icon: CheckCircle2 },
  CANCELLED: { color: "bg-red-100 text-red-700 border-red-500", icon: XCircle },
  REFUND_REQUESTED: { color: "bg-orange-100 text-orange-700 border-orange-500", icon: Undo2 },
};

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast().toast;

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getOrder(id);
      setOrder(response);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Error loading order details";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?\nThis action cannot be undone.")) return;
    setCancelling(true);
    try {
      await cancelOrder(id);
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
      toast.success("Order cancelled");
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to cancel order";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(`#${order.id}`);
      setCopied(true);
      toast.success("Order ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please try again.");
    }
  };

  const canCancel = order && (order.status === "PENDING" || order.status === "CONFIRMED");

  if (loading) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto space-y-4">
          <OrderCardSkeleton />
          <div className="h-48 rounded-2xl" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}></div>
          <div className="h-32 rounded-2xl" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}></div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <ErrorState
          title="Failed to load order"
          message={error}
          onRetry={fetchOrder}
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link to="/orders" className="btn btn-modern btn-modern-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["PENDING"];
  const StatusIcon = statusCfg.icon;
  const delivery = order.deliveryAddress || {};
  const timeline = order.statusHistory || [];
  const steps = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Order #{order.id}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Placed {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Unknown"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${statusCfg.color}`}>
              <StatusIcon className="w-4 h-4" />
              {order.status?.replace("_", " ")}
            </span>
            <button onClick={copyOrderId} className="btn btn-modern btn-modern-secondary">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>
        </div>

        {/* Progress stepper */}
        {order.status !== "CANCELLED" && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => {
                const done = idx <= currentStepIndex;
                return (
                  <div key={step} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        done ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                      }`}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">{step}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 ${idx < currentStepIndex ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
{/* Items */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
               <h3 className="text-lg font-bold mb-4">Order Items</h3>
               {order.items?.length === 0 ? (
                 <p className="text-gray-500">No items found.</p>
               ) : (
                 <div className="space-y-4">
                   {order.items.map((item) => (
                     <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                       <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                         {item.primaryImageUrl ? (
                           <img src={item.primaryImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                         ) : (
                           <Package className="w-6 h-6 text-gray-300" aria-label="No image" />
                         )}
                       </div>
                       <div className="flex-1">
                         <p className="font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                         <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity} × ₹{item.unitPrice?.toFixed(2)}</p>
                       </div>
                       <div className="text-right">
                         <p className="font-bold text-blue-600">₹{item.lineTotal?.toFixed(2)}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Price Breakdown */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
               <h3 className="text-lg font-bold mb-4">Price Breakdown</h3>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span className="font-medium">₹{order.subtotal?.toFixed(2)}</span></div>
                 {order.discountAmount > 0 && (
                   <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Discount</span><span className="font-medium text-red-600">- ₹{order.discountAmount?.toFixed(2)}</span></div>
                 )}
                 <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Shipping</span><span className="font-medium">{(order.shippingFee ?? 0) === 0 ? "Free" : `₹${order.shippingFee?.toFixed(2)}`}</span></div>
                 <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-base"><span className="font-bold">Total</span><span className="font-bold text-blue-600">₹{order.totalAmount?.toFixed(2)}</span></div>
               </div>
             </div>

             {/* Delivery Address */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
               <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Delivery Address</h3>
               <div className="text-sm text-gray-700 dark:text-gray-300">
                 <p className="font-semibold">{delivery.fullName || "N/A"}</p>
                 {delivery.phone && <p className="text-gray-500">{delivery.phone}</p>}
                 <p>{[delivery.line1, delivery.line2, delivery.city, delivery.state, delivery.pinCode, delivery.country].filter(Boolean).join(", ")}</p>
               </div>
             </div>

             {/* Track Order - Placeholder */}
             {order.status === "SHIPPED" && (
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                 <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-600" /> Track Order</h3>
                 <p className="text-sm text-gray-500">
                   Your order is on the way! Estimated delivery in 2-3 business days.
                   {order.trackingNumber && ` Tracking number: ${order.trackingNumber}`}
                 </p>
               </div>
             )}

             {/* Timeline */}
             {timeline.length > 0 && (
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                 <h3 className="text-lg font-bold mb-4">Order Timeline</h3>
                 <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                   {timeline.map((h, idx) => (
                     <div key={idx} className="relative">
                       <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-gray-800" />
                       <div>
                         <p className="font-semibold text-sm">{h.status?.replace("_", " ")}</p>
                         <p className="text-xs text-gray-500">{h.changedAt ? new Date(h.changedAt).toLocaleString() : ""}</p>
                         {h.note && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{h.note}</p>}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4">Order Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium">{order.paymentMethod || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium">{order.status?.replace("_", " ")}</span></div>
                {order.trackingNumber && <div className="flex justify-between"><span className="text-gray-500">Tracking</span><span className="font-medium">{order.trackingNumber}</span></div>}
                {order.courierName && <div className="flex justify-between"><span className="text-gray-500">Courier</span><span className="font-medium">{order.courierName}</span></div>}
              </div>

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full mt-6 btn btn-modern btn-modern-danger flex items-center justify-center gap-2"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Cancel Order
                </button>
              )}

              <Link to="/orders" className="w-full mt-3 btn btn-modern btn-modern-secondary block text-center">
                &larr; Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetails;
