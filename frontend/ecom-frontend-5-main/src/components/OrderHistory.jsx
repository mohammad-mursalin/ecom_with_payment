import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "./Toast";
import { getOrders, cancelOrder } from "../services/orderService";
import { Clock } from "lucide-react";
import Pagination from "./Pagination";
import { usePagination } from "../hooks/usePagination";
import OrderCardSkeleton from "./OrderCardSkeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_CONFIG = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-800", label: "Confirmed" },
  SHIPPED: { bg: "bg-purple-100", text: "text-purple-800", label: "Shipped" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-800", label: "Delivered" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
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
      <div className="page-container">
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
      <div className="page-container">
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
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="page-title">Order History</h1>
          <p className="page-subtitle">Track and manage your recent orders</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => {
                setPage(0);
                setActiveStatus(status);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeStatus === status
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  <div key={order.id} className="order-card">
                    <div className="order-card-header flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id}</h3>
                        <p className="text-sm opacity-75">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Unknown date"}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="order-card-body">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
                          <p className="font-medium">{itemCount} items</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                          <p className="font-bold text-lg">₹{order.totalAmount?.toFixed(2) ?? "0.00"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/orders/${order.id}`}
                          className="btn-modern btn-modern-primary"
                        >
                          View Details
                        </Link>
                        {order.status === "PENDING" && (
                          <button
                            onClick={() => handleCancelClick(order.id)}
                            className="btn-modern btn-modern-danger"
                          >
                            Cancel
                          </button>
                        )}
                        {order.status === "DELIVERED" && order.items?.[0]?.productId && (
                          <button
                            onClick={() => handleLeaveReview(order.items[0].productId)}
                            className="btn-modern btn-modern-secondary"
                          >
                            Leave a Review
                          </button>
                        )}
                      </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Cancel Order?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-modern btn-modern-secondary"
                >
                  No, Keep Order
                </button>
                <button
                  onClick={handleCancelConfirm}
                  className="btn-modern btn-modern-danger"
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
