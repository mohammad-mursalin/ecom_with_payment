import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useToast } from "./Toast";
import { getOrder, cancelOrder } from "../services/orderService";
import {
  MapPin, Truck, CheckCircle2, Copy, Check, XCircle, Clock,
  Undo2, Loader2, Package
} from "lucide-react";
import { motion } from "framer-motion";
import OrderCardSkeleton from "../components/OrderCardSkeleton";
import ErrorState from "../components/ErrorState";

const STATUS_CONFIG = {
  PENDING: { color: "bg-warning/10 text-warning", icon: Clock },
  CONFIRMED: { color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  SHIPPED: { color: "bg-info/10 text-info", icon: Truck },
  DELIVERED: { color: "bg-success/10 text-success", icon: CheckCircle2 },
  CANCELLED: { color: "bg-danger/10 text-danger", icon: XCircle },
  REFUND_REQUESTED: { color: "bg-warning/10 text-warning", icon: Undo2 },
};

const BASE_BADGE_CLASSES = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium";

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
      <div className="bg-background min-h-screen px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <OrderCardSkeleton />
          <div className="rounded-2xl border border-default bg-surface-card"></div>
          <div className="rounded-2xl border border-default bg-surface-card"></div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-4 py-12">
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
      <div className="bg-background min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Order not found</h2>
          <Link to="/orders" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none">
            Back to Orders
          </Link>
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
    <div className="bg-background min-h-screen px-4 md:px-6 lg:px-8 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Order #{order.id}</h1>
            <p className="text-sm text-muted mt-1">
              Placed {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Unknown"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`${statusCfg.color} ${BASE_BADGE_CLASSES}`}>
              <StatusIcon className="w-4 h-4" />
              {order.status?.replace("_", " ")}
            </span>
            <button onClick={copyOrderId} className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated">
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
                        done ? "bg-primary text-white" : "bg-default text-muted"
                      }`}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className="text-xs mt-1 text-muted">{step}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 ${idx < currentStepIndex ? "bg-primary" : "bg-default"}`} />
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
             <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                {order.items?.length === 0 ? (
                  <p className="text-muted">No items found.</p>
                ) : (
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-background">
                        <div className="w-16 h-16 rounded-lg bg-surface border border-default flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.primaryImageUrl ? (
                            <img src={item.primaryImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-muted" aria-label="No image" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-primary">{item.productName}</p>
                          <p className="text-sm text-muted">Qty: {item.quantity} × ₹{item.unitPrice?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">₹{item.lineTotal?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
                <h3 className="text-lg font-semibold mb-4">Price Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-secondary">Subtotal</span><span className="font-medium">₹{order.subtotal?.toFixed(2)}</span></div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-secondary">Discount</span><span className="font-medium text-danger">- ₹{order.discountAmount?.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between text-sm"><span className="text-secondary">Shipping</span><span className="font-medium">{(order.shippingFee ?? 0) === 0 ? "Free" : `₹${order.shippingFee?.toFixed(2)}`}</span></div>
                  <div className="border-t border-default pt-3 flex justify-between text-base"><span className="font-bold">Total</span><span className="font-bold text-primary">₹{order.totalAmount?.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Delivery Address</h3>
                <div className="text-sm text-secondary">
                  <p className="font-semibold">{delivery.fullName || "N/A"}</p>
                  {delivery.phone && <p className="text-muted">{delivery.phone}</p>}
                  <p>{[delivery.line1, delivery.line2, delivery.city, delivery.state, delivery.pinCode, delivery.country].filter(Boolean).join(", ")}</p>
                </div>
              </div>

              {/* Track Order - Placeholder */}
              {order.status === "SHIPPED" && (
                <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Track Order</h3>
                  <p className="text-sm text-muted">
                    Your order is on the way! Estimated delivery in 2-3 business days.
                    {order.trackingNumber && ` Tracking number: ${order.trackingNumber}`}
                  </p>
                </div>
              )}

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
                  <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
                  <div className="relative pl-6 border-l-2 border-default space-y-4">
                    {timeline.map((h, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-2.5 top-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface" />
                        <div>
                          <p className="font-semibold text-sm">{h.status?.replace("_", " ")}</p>
                          <p className="text-xs text-muted">{h.changedAt ? new Date(h.changedAt).toLocaleString() : ""}</p>
                          {h.note && <p className="text-sm text-secondary mt-1">{h.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
           </div>

           {/* Right Sidebar */}
           <div className="space-y-6">
             <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
               <h3 className="text-lg font-semibold mb-4">Order Info</h3>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between"><span className="text-muted">Payment</span><span className="font-medium">{order.paymentMethod || "N/A"}</span></div>
                 <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-medium">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</span></div>
                 <div className="flex justify-between"><span className="text-muted">Status</span><span className="font-medium">{order.status?.replace("_", " ")}</span></div>
                 {order.trackingNumber && <div className="flex justify-between"><span className="text-muted">Tracking</span><span className="font-medium">{order.trackingNumber}</span></div>}
                 {order.courierName && <div className="flex justify-between"><span className="text-muted">Courier</span><span className="font-medium">{order.courierName}</span></div>}
               </div>

               {canCancel && (
                 <button
                   onClick={handleCancel}
                   disabled={cancelling}
                   className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                 >
                   {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                   Cancel Order
                 </button>
               )}

               <Link to="/orders" className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated block">
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
