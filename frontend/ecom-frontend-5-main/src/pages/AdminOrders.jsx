import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../components/Toast";
import { getOrder } from "../services/orderService";
import { getOrders, updateOrderStatus, resendOrderEmail } from "../services/adminService";
import { Package } from "lucide-react";
import Pagination from "../components/Pagination";
import TableRowSkeleton from "../components/TableRowSkeleton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

function useFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (focusable.length === 0) return;

        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return containerRef;
}

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUND_REQUESTED", "REFUNDED"];

const PAYMENT_METHOD_OPTIONS = ["ALL", "STRIPE", "RAZORPAY"];

const STATUS_COLORS = {
  PENDING: { bg: "var(--color-warning)", text: "var(--text-primary)" },
  CONFIRMED: { bg: "var(--color-primary)", text: "#ffffff" },
  SHIPPED: { bg: "var(--color-info)", text: "#ffffff" },
  DELIVERED: { bg: "var(--color-success)", text: "#ffffff" },
  CANCELLED: { bg: "var(--color-danger)", text: "#ffffff" },
  REFUND_REQUESTED: { bg: "var(--color-warning)", text: "#ffffff" },
  REFUND_PROCESSING: { bg: "var(--color-warning)", text: "#ffffff" },
  REFUNDED: { bg: "var(--color-muted)", text: "#ffffff" },
};

const ALLOWED_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUND_PROCESSING"],
  REFUND_PROCESSING: ["REFUNDED"],
};

 const AdminOrders = () => {
   const [orders, setOrders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [selectedOrder, setSelectedOrder] = useState(null);
   const [detailLoading, setDetailLoading] = useState(false);
   const [searchParams, setSearchParams] = useSearchParams();
   const { toast } = useToast();

   const status = searchParams.get("status") || "ALL";
   const paymentMethod = searchParams.get("paymentMethod") || "ALL";
   const searchQuery = searchParams.get("search") || "";
   const fromDate = searchParams.get("fromDate") || "";
   const toDate = searchParams.get("toDate") || "";
   const page = Number(searchParams.get("page") || "0");
   const pageSize = Number(searchParams.get("pageSize") || "20");

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [statusForm, setStatusForm] = useState({
    status: "",
    note: "",
    trackingNumber: "",
    courierName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const orderDrawerRef = useFocusTrap(!!selectedOrder, () => setSelectedOrder(null));

   const fetchOrders = useCallback(async () => {
     setLoading(true);
     setError("");
     try {
       const params = {
         page,
         pageSize,
         ...(status !== "ALL" ? { status } : {}),
         ...(paymentMethod !== "ALL" ? { paymentMethod } : {}),
         ...(searchQuery ? { search: searchQuery } : {}),
         ...(fromDate ? { startDate: fromDate } : {}),
         ...(toDate ? { endDate: toDate } : {}),
       };
       const data = await getOrders(params);
       const dataArr = data.content || data.data || [];
       setOrders(dataArr);
       setTotalElements(data.totalElements || dataArr.length);
       setTotalPages(data.totalPages || 1);
     } catch (err) {
       const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load orders";
       setError(msg);
       toast.error(msg);
     } finally {
       setLoading(false);
     }
   }, [page, pageSize, status, paymentMethod, searchQuery, fromDate, toDate, toast]);

   useEffect(() => {
     fetchOrders();
   }, [status, paymentMethod, searchQuery, fromDate, toDate, page, pageSize, fetchOrders]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

   const updateSearchParam = (key, value) => {
     setSearchParams((prev) => {
       const next = new URLSearchParams(prev);
       if (value && value !== "ALL" && value !== "") next.set(key, value);
       else next.delete(key);
       if (key !== "page" && key !== "pageSize") next.delete("page");
       return next;
     });
   };

   const handlePageSizeChange = (newPageSize) => {
     updateSearchParam("pageSize", String(newPageSize));
     updateSearchParam("page", "0");
   };

   const updateFilter = (key, value) => {
    if (key === "status") updateSearchParam("status", value);
    if (key === "paymentMethod") updateSearchParam("paymentMethod", value);
    if (key === "search") {
      updateSearchParam("search", value);
    }
    if (key === "fromDate") updateSearchParam("fromDate", value);
    if (key === "toDate") updateSearchParam("toDate", value);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    updateFilter("search", value);
  };

  const handleOpenDetail = async (order) => {
    setDetailLoading(true);
    setSelectedOrder(null);
    try {
      const data = await getOrder(order.id);
      const orderData = data.data || data;
      setSelectedOrder({ ...orderData, totalElements, totalPages });
      setStatusForm({
        status: orderData.status || "",
        note: "",
        trackingNumber: orderData.trackingNumber || "",
        courierName: orderData.shippingCarrier || "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load order details");
    } finally {
      setDetailLoading(false);
    }
  };

  const allowedNextStatuses = useMemo(() => {
    if (!selectedOrder?.status) return [];
    return ALLOWED_TRANSITIONS[selectedOrder.status] || [];
  }, [selectedOrder]);

  const handleStatusSubmit = async () => {
    if (!selectedOrder || !statusForm.status) return;
    setSubmitting(true);
    try {
      const body = {
        status: statusForm.status,
        note: statusForm.note || undefined,
        trackingNumber: statusForm.trackingNumber || undefined,
        courierName: statusForm.courierName || undefined,
      };
      await updateOrderStatus(selectedOrder.id, body);
      const data = await getOrder(selectedOrder.id);
      const orderData = data.data || data;
      setSelectedOrder({ ...orderData, totalElements, totalPages });
      toast.success(`Order updated to ${statusForm.status}`);
      setStatusForm((prev) => ({ ...prev, status: orderData.status || "", note: "", trackingNumber: "", courierName: "" }));
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!selectedOrder) return;
    try {
      await resendOrderEmail(selectedOrder.id);
      toast.success("Confirmation email queued for sending.");
    } catch (err) {
      toast.error("Failed to resend email");
    }
  };

  const exportToCsv = () => {
    const rows = orders.map((order) => ({
      OrderId: order.id,
      Date: order.createdAt ? new Date(order.createdAt).toISOString() : "",
      CustomerEmail: order.customerEmail || order.user?.email || "",
      Items: order.orderItems?.length || 0,
      Subtotal: order.subtotal || "",
      Discount: order.discountAmount || "",
      Tax: order.taxAmount || "",
      Shipping: order.shippingFee || "",
      Total: order.totalAmount || "",
      Status: order.status || "",
      PaymentMethod: order.paymentMethod || "",
    }));
    if (rows.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv =
      keys.join(",") +
      "\n" +
      rows
        .map((row) =>
          keys
            .map((key) => {
              const value = row[key];
              if (value === null || value === undefined) return "";
              const str = String(value);
              if (str.includes(",") || str.includes('"')) return `"${str.replace(/"/g, '""')}"`;
              return str;
            })
            .join(",")
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const renderTimeline = (history) => {
    if (!history || history.length === 0) {
      return <p className="text-sm text-muted">No status history available.</p>;
    }
    return (
      <div className="mt-4 space-y-3">
        {history.map((entry, idx) => {
            const color = STATUS_COLORS[entry.newStatus] || { bg: "var(--color-border)", text: "var(--text-primary)" };
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color.bg }} />
                  {idx < history.length - 1 && <div className="mt-1 h-8 w-0.5 bg-border-default" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: color.bg, color: color.text }}>
                      {entry.newStatus}
                    </span>
                    <span className="text-xs text-muted">
                      {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    changed by: {entry.changedBy?.username || "System"}
                  </p>
                  {entry.note && <p className="text-xs text-muted italic">Note: {entry.note}</p>}
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Order Management</h2>
          <p className="text-sm text-muted">Manage orders, update status, and view details.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportToCsv} className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated">
            Export CSV
          </button>
          {orders.length > 0 && page === 0 && (
            <span className="text-xs text-muted">CSV exports current page only</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-surface-card p-6">
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Status</label>
            <select
              value={status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "ALL" ? "All" : opt.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => updateFilter("paymentMethod", e.target.value)}
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "ALL" ? "All" : opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => updateFilter("fromDate", e.target.value)}
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => updateFilter("toDate", e.target.value)}
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Order ID or customer email"
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary placeholder:text-muted"
            />
          </div>
        </div>
      </div>

       <div className="mb-4">
         <Pagination
           currentPage={page}
           totalPages={totalPages}
           totalElements={totalElements}
           pageSize={pageSize}
           onPageChange={(nextPage) => updateSearchParam("page", String(nextPage))}
           onPageSizeChange={handlePageSizeChange}
         />
       </div>

{loading && orders.length === 0 ? (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-primary">Orders Management</h2>
        <p className="text-sm text-muted">Loading orders...</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-default bg-surface-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default bg-surface-elevated text-left text-xs font-semibold text-muted uppercase">
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {Array.from({ length: 8 }).map((_, idx) => (
              <TableRowSkeleton key={idx} columns={8} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : error ? (
    <div className="max-w-5xl mx-auto">
      <ErrorState
        title="Failed to load orders"
        message={error}
        onRetry={fetchOrders}
      />
    </div>
  ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            description="Try adjusting your filters or search criteria."
            actionLabel="Clear Filters"
            onAction={() => setSearchParams({ page: "0" })}
          />
        ) : (
        <div className="overflow-x-auto rounded-2xl border border-default bg-surface-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default text-left text-xs font-semibold text-muted uppercase">
                <th className="pb-3 pt-3 pl-4 pr-4">Order ID</th>
                <th className="pb-3 pt-3 pr-4">Customer</th>
                <th className="pb-3 pt-3 pr-4">Items</th>
                <th className="pb-3 pt-3 pr-4">Total</th>
                <th className="pb-3 pt-3 pr-4">Payment</th>
                <th className="pb-3 pt-3 pr-4">Status</th>
                <th className="pb-3 pt-3 pr-4">Date</th>
                <th className="pb-3 pt-3 pl-4">Actions</th>
              </tr>
            </thead>
            <tbody>
               {orders.map((order) => {
                 const itemCount = order.itemCount ?? 0;
                 const firstItem = "";
                 const statusColor = STATUS_COLORS[order.status] || { bg: "var(--color-border)", text: "var(--text-primary)" };
                 return (
                   <tr key={order.id} className="border-b border-default hover:bg-surface-elevated">
                     <td className="py-4 pl-4 pr-4 font-mono text-primary">{order.id}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                        >
                          {(order.customerEmail || order.user?.email || "U")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-primary">{order.customerEmail || order.user?.email || "N/A"}</div>
                          {order.user?.username && (
                            <div className="text-xs text-muted">{order.user.username}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-secondary">
                      {itemCount > 0 ? (
                        <span>
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                          {firstItem ? <span className="block text-xs text-muted">First: {firstItem}</span> : null}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="font-semibold text-primary">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="py-4 pr-4 text-secondary">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2 py-1 text-xs font-medium text-muted">
                        {order.paymentMethod || "—"}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        {(order.status || "").replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-secondary">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-4 pl-4">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-surface-elevated"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
           </table>
         </div>
       )}

      {detailLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="rounded-2xl bg-surface-card p-6 shadow-xl dark:bg-surface">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-secondary">Loading order…</p>
          </div>
        </div>
      )}

{selectedOrder && !detailLoading && (
         <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="order-drawer-title">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} aria-hidden="true" />
           <div ref={orderDrawerRef} className="relative h-full w-full max-w-2xl overflow-y-auto bg-surface-card shadow-2xl dark:bg-surface">
             <div className="sticky top-0 z-10 flex items-center justify-between border-b border-default bg-surface-card px-6 py-4">
               <h3 id="order-drawer-title" className="text-lg font-semibold text-primary">Order #{selectedOrder.id}</h3>
               <button
                 onClick={() => setSelectedOrder(null)}
                 className="rounded-lg p-2 text-muted hover:bg-surface-elevated"
                 aria-label="Close order details"
               >
                 ✕
               </button>
             </div>

            <div className="space-y-6 px-6 py-6">
              <section>
                <h4 className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">Order Info</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted">Order ID</p>
                    <button
                      onClick={() => copyToClipboard(`#${selectedOrder.id}`)}
                      className="flex items-center gap-2 rounded-lg border border-default bg-surface-elevated px-3 py-2 text-sm font-mono text-primary"
                    >
                      #{selectedOrder.id}
                      <span className="text-xs text-primary">Copy</span>
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Date Placed</p>
                    <p className="text-sm font-medium text-primary">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Payment Method</p>
                    <p className="text-sm font-medium text-primary">{selectedOrder.paymentMethod || "—"}</p>
                  </div>
                </div>
                {selectedOrder.paymentReference && (
                  <div className="mt-3">
                    <p className="text-xs text-muted">Payment Reference</p>
                    <button
                      onClick={() => copyToClipboard(selectedOrder.paymentReference)}
                      className="flex items-center gap-2 rounded-lg border border-default bg-surface-elevated px-3 py-2 text-sm font-mono text-primary"
                    >
                      {selectedOrder.paymentReference}
                      <span className="text-xs text-primary">Copy</span>
                    </button>
                  </div>
                )}
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">Customer</h4>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {(selectedOrder.customerEmail || selectedOrder.user?.email || "U")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-primary">
                      {selectedOrder.user?.username || selectedOrder.customerEmail || "Customer"}
                    </p>
                    <a
                      href={`mailto:${selectedOrder.customerEmail || selectedOrder.user?.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedOrder.customerEmail || selectedOrder.user?.email}
                    </a>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">Delivery Address</h4>
                <div className="rounded-2xl border border-default bg-surface-elevated p-4">
                  {selectedOrder.deliveryAddress ? (
                    <div className="text-sm text-primary">
                      <p className="font-medium">{selectedOrder.deliveryAddress.fullName || selectedOrder.deliveryAddress.label}</p>
                      <p>{selectedOrder.deliveryAddress.line1}</p>
                      {selectedOrder.deliveryAddress.line2 && <p>{selectedOrder.deliveryAddress.line2}</p>}
                      <p>
                        {selectedOrder.deliveryAddress.city}
                        {selectedOrder.deliveryAddress.state ? `, ${selectedOrder.deliveryAddress.state}` : ""}
                        {selectedOrder.deliveryAddress.pinCode ? ` - ${selectedOrder.deliveryAddress.pinCode}` : ""}
                      </p>
                      <p>{selectedOrder.deliveryAddress.country}</p>
                      {selectedOrder.deliveryAddress.phone && <p className="mt-1 text-secondary">Phone: {selectedOrder.deliveryAddress.phone}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No address on file.</p>
                  )}
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-default">
                        <th className="pb-2 font-medium text-muted"></th>
                        <th className="pb-2 font-medium text-muted">Product</th>
                        <th className="pb-2 font-medium text-muted">Qty</th>
                        <th className="pb-2 font-medium text-muted">Unit Price</th>
                        <th className="pb-2 text-right font-medium text-muted">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-default">
                      {(selectedOrder.orderItems || []).map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 pr-3">
                            {item.productImageUrl ? (
                              <img src={item.productImageUrl} alt={item.productName} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-surface-elevated" />
                            )}
                          </td>
                          <td className="py-3 pr-3">
                            {item.productId ? (
                              <a
                                href={`/products/${item.productId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-primary hover:underline"
                              >
                                {item.productName || `Product #${item.productId}`}
                              </a>
                            ) : (
                              <span className="font-medium text-primary">{item.productName || "—"}</span>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-secondary">{item.quantity}</td>
                          <td className="py-3 pr-3 text-secondary">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 text-right font-medium text-primary">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-secondary">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-secondary">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Shipping</span>
                    <span>{formatCurrency(selectedOrder.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-default pt-2 text-base font-semibold text-primary">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">
                  Status & Timeline
                </h4>
                {renderTimeline(selectedOrder.statusHistory)}
              </section>

              <section>
                <h4 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wide">Admin Actions</h4>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-default bg-surface-card p-4">
                    <h5 className="mb-3 text-sm font-semibold text-primary">Update Order Status</h5>
                    {allowedNextStatuses.length === 0 ? (
                      <p className="text-sm text-muted">No further actions available for this order.</p>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-secondary">New Status</label>
                          <select
                            value={statusForm.status}
                            onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
                          >
                            <option value="">Select status</option>
                            {allowedNextStatuses.map((s) => (
                              <option key={s} value={s}>
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>

                        {statusForm.status === "SHIPPED" && (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-secondary">Tracking Number</label>
                              <input
                                type="text"
                                value={statusForm.trackingNumber}
                                onChange={(e) => setStatusForm((prev) => ({ ...prev, trackingNumber: e.target.value }))}
                                className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
                                placeholder="Tracking #"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-secondary">Courier Name</label>
                              <input
                                type="text"
                                value={statusForm.courierName}
                                onChange={(e) => setStatusForm((prev) => ({ ...prev, courierName: e.target.value }))}
                                className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
                                placeholder="Courier"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="mb-1 block text-xs font-medium text-secondary">Note (optional)</label>
                          <textarea
                            value={statusForm.note}
                            onChange={(e) => setStatusForm((prev) => ({ ...prev, note: e.target.value }))}
                            className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
                            rows={3}
                            placeholder="Internal note — not visible to customer"
                          />
                        </div>

                        <button
                          onClick={handleStatusSubmit}
                          disabled={submitting || !statusForm.status}
                          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? "Updating…" : "Update Status"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-default bg-surface-card p-4">
                    <h5 className="mb-3 text-sm font-semibold text-primary">Communication</h5>
                    <button
                      onClick={handleResendEmail}
                      className="w-full rounded-lg border border-default bg-surface-card px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-surface-elevated"
                    >
                      Resend Confirmation Email
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
