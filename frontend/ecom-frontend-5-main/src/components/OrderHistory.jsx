import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { getOrders, cancelOrder } from "../services/orderService";
import { Clock } from "lucide-react";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import OrderCardSkeleton from "../components/OrderCardSkeleton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const BASE_BADGE_CLASSES = "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium";

const STATUS_CONFIG = {
  PENDING: { color: "bg-warning/10 text-warning", label: "Pending" },
  CONFIRMED: { color: "bg-primary/10 text-primary", label: "Confirmed" },
  SHIPPED: { color: "bg-info/10 text-info", label: "Shipped" },
  DELIVERED: { color: "bg-success/10 text-success", label: "Delivered" },
  CANCELLED: { color: "bg-danger/10 text-danger", label: "Cancelled" },
};

export default function OrderHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const toast = useToast().toast;
  const navigate = useNavigate();
  const { page, pageSize, setPage, setPageSize } = usePagination();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, pageSize };
      if (activeStatus !== "ALL") params.status = activeStatus;
      const response = await getOrders(params);
      setData(response);
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to fetch orders";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeStatus, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelClick = (orderId) => {
    setOrderToCancel(orderId);
    setShowConfirmModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    try {
      await cancelOrder(orderToCancel);
      setData((prev) => ({
        ...prev,
        content: prev.content.map((o) => (o.id === orderToCancel ? { ...o, status: "CANCELLED" } : o)),
      }));
      toast.success("Order cancelled successfully");
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to cancel order";
      toast.error(msg);
    } finally {
      setShowConfirmModal(false);
      setOrderToCancel(null);
    }
  };

  const handleLeaveReview = (productId) => {
    navigate(`/products/${productId}#reviews`);
  };

  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

if (loading) {
    return (
      <div className="bg-background min-h-screen px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <OrderCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <ErrorState
            title="Failed to load orders"
            message={error}
            onRetry={() => fetchOrders()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Order History</h1>
          <p className="text-base text-secondary mt-2">Track and manage your recent orders</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => {
                setPage(0);
                setActiveStatus(status);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeStatus === status
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface border border-default hover:bg-surface-elevated"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
            </button>
          ))}
        </div>

        {(!data?.content || data.content.length === 0) ? (
          <EmptyState
            icon={Clock}
            title="No orders found"
            description={activeStatus === "ALL" ? "You have no orders yet. Start shopping to see your orders here." : `No ${activeStatus.toLowerCase().replace("_", " ")} orders found.`}
            actionLabel="Shop Now"
            actionHref="/products"
          />
        ) : (
          <>
            <div className="space-y-4">
              {data.content.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const itemCount = order.items?.length ?? order.itemCount ?? 0;

                return (
                  <div key={order.id} className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">Order #{order.id}</h3>
                        <p className="text-sm text-muted">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Unknown date"}
                        </p>
                      </div>
                      <span className={`${statusConfig.color} ${BASE_BADGE_CLASSES}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className="text-sm text-secondary">Items</p>
                        <p className="font-medium">{itemCount} items</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-secondary">Total</p>
                        <p className="text-xl font-bold">₹{order.totalAmount?.toFixed(2) ?? "0.00"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                      >
                        View Details
                      </Link>
                      {order.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelClick(order.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                        >
                          Cancel
                        </button>
                      )}
                      {order.status === "DELIVERED" && order.items?.[0]?.productId && (
                        <button
                          onClick={() => handleLeaveReview(order.items[0].productId)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated"
                        >
                          Leave a Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(0);
                }}
              />
            )}
          </>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface-elevated rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Cancel Order?</h3>
              <p className="text-sm text-secondary mb-6">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated"
                >
                  No, Keep Order
                </button>
                <button
                  onClick={handleCancelConfirm}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-danger/90 dark:shadow-none"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
