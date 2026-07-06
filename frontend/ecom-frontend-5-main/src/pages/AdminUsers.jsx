import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../components/Toast";
import { getUsers, updateUserRole, updateUserStatus } from "../services/adminService";
import { Search, Download, Eye, XCircle, Trash2, Users } from "lucide-react";
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

const ROLE_BADGE = {
  ADMIN: "bg-primary/10 text-primary",
  USER: "bg-surface-elevated text-muted",
};

const STATUS_BADGE = {
  ACTIVE: "bg-success/10 text-success",
  SUSPENDED: "bg-warning/10 text-warning",
};

function hashStringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function Avatar({ username, size = 36 }) {
  const initial = (username || "U").charAt(0).toUpperCase();
  const bg = hashStringToColor(username || "U");
  return (
    <div
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full text-white font-semibold select-none"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

function getRoleBadgeClass(role) {
  return ROLE_BADGE[role] || "bg-surface-elevated text-muted";
}

function getStatusBadgeClass(status) {
  return STATUS_BADGE[status] || "bg-surface-elevated text-muted";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function formatCurrency(value) {
  const num = Number(value || 0);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const debounceRef = useRef(null);

  const userDrawerRef = useFocusTrap(drawerOpen, () => setDrawerOpen(false));

  const fetchUsers = useCallback(
    async (page, size, search) => {
      setLoading(true);
      setError("");
      try {
        const data = await getUsers({ page, pageSize: size, search });
        let dataArr = [];
        let meta = {};

        if (data && Array.isArray(data.content)) {
          dataArr = data.content;
          meta = {
            totalElements: data.totalElements ?? 0,
            totalPages: data.totalPages ?? 0,
            currentPage: data.currentPage ?? page,
          };
        } else if (data && Array.isArray(data.data)) {
          dataArr = data.data;
          meta = { totalElements: data.totalElements ?? data.data.length, totalPages: 1, currentPage: page };
        } else if (Array.isArray(data)) {
          dataArr = data;
          meta = { totalElements: data.length, totalPages: 1, currentPage: page };
        }

        setUsers(dataArr);
        setTotalElements(meta.totalElements ?? dataArr.length);
        setTotalPages(meta.totalPages ?? 1);
        setCurrentPage(meta.currentPage ?? page);
        setPageSize(size);
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load users";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchUsers(0, 20, "");
  }, [fetchUsers]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(0, pageSize, value);
    }, 350);
  };

  const handlePageChange = useCallback(
    (newPage) => {
      fetchUsers(newPage, pageSize, searchQuery);
    },
    [fetchUsers, pageSize, searchQuery]
  );

  const handleRoleChange = async (user, newRole) => {
    if (user.userId === currentUser?.userId) return;
    setActionLoading(true);
    try {
      await updateUserRole(user.userId, newRole);
      toast.success(`${user.username}'s role changed to ${newRole}`);
      fetchUsers(currentPage, pageSize, searchQuery);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to change role";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    if (user.userId === currentUser?.userId) return;
    setActionLoading(true);
    try {
      await updateUserStatus(user.userId, newStatus);
      const actionLabel = newStatus === "SUSPENDED" ? "Account suspended" : "Account restored";
      toast.info(`${user.username}: ${actionLabel}`);
      fetchUsers(currentPage, pageSize, searchQuery);
      if (selectedUser && selectedUser.userId === user.userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to update status";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    try {
      const data = await getUsers({ page: 0, pageSize: 1 });
      const userData = data?.content?.[0] || user;
      setSelectedUser(userData);
      setDrawerOpen(true);
    } catch {
      setSelectedUser(user);
      setDrawerOpen(true);
    }
  };

  const handleExportCsv = () => {
    if (users.length === 0) return;

    const headers = ["User ID", "Username", "Email", "Role", "Status", "Joined Date", "Total Orders"];
    const csvContent = [
      headers.join(","),
      ...users.map((u) => [
        u.userId,
        `"${u.username}"`,
        `"${u.email}"`,
        u.role,
        u.status,
        formatDate(u.createdAt),
        u.orderCount ?? 0,
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSelf = (userId) => userId === currentUser?.userId;

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-primary">Users Management</h2>
          <p className="text-sm text-muted">Loading users...</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-default bg-surface-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default bg-surface-elevated text-left text-xs font-semibold text-muted uppercase">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {Array.from({ length: 8 }).map((_, idx) => (
                <TableRowSkeleton key={idx} columns={5} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

if (error) {
     return (
       <div className="max-w-5xl mx-auto">
         <ErrorState
           title="Failed to load users"
           message={error}
           onRetry={() => fetchUsers(currentPage, pageSize, searchQuery)}
         />
       </div>
     );
    }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">
            Users Management
          </h2>
          <p className="text-sm text-muted">
            Showing {totalElements === 0 ? 0 : currentPage * pageSize + 1}–
            {Math.min((currentPage + 1) * pageSize, totalElements)} of{" "}
            {totalElements} users
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-default bg-surface-card py-2.5 pl-9 pr-4 text-sm text-primary placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={handleExportCsv}
            disabled={users.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

{users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description={searchQuery ? "Try adjusting your search or clear it to see all users." : "No users are registered yet."}
            actionLabel={searchQuery ? "Clear Search" : "Refresh"}
            onAction={searchQuery ? () => setSearchQuery("") : fetchUsers}
          />
        ) : (
        <div className="overflow-x-auto rounded-2xl border border-default bg-surface-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default bg-surface-elevated text-left text-xs font-semibold text-muted uppercase">
                <th className="px-4 py-3">
                  User
                </th>
                <th className="px-4 py-3">
                  Role
                </th>
                <th className="px-4 py-3">
                  Status
                </th>
                <th className="px-4 py-3">
                  Joined
                </th>
                <th className="px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {users.map((u) => {
                const self = isSelf(u.userId);
                return (
                  <tr
                    key={u.userId}
                    className="transition-colors hover:bg-surface-elevated"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar username={u.username} size={36} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-primary">
                            {u.username}
                          </div>
                          <div className="truncate text-xs text-muted">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {self ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(u.role)}`}
                        >
                          {u.role}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          disabled={actionLoading}
                          className="rounded-lg border border-default bg-surface-card px-2 py-1.5 text-xs text-primary"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(u.status)}`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          onClick={() => handleViewUser(u)}
                          className="inline-flex items-center gap-1 rounded-lg border border-default bg-surface-card px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-surface-elevated"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        {!self && (
                          <>
                            <button
                              onClick={() => handleStatusChange(u, u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")}
                              disabled={actionLoading}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                                u.status === "SUSPENDED"
                                  ? "bg-success/10 text-success"
                                  : "bg-warning/10 text-warning"
                              }`}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">
                                {u.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(u, "DELETED")}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      )}

{selectedUser && (
         <UserDetailDrawer
           user={selectedUser}
           isOpen={drawerOpen}
           onClose={() => setDrawerOpen(false)}
           focusTrapRef={userDrawerRef}
         />
       )}
    </div>
  );
}

function UserDetailDrawer({ user, isOpen, onClose, focusTrapRef }) {
  if (!user) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${isOpen ? "" : "pointer-events-none"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-drawer-title"
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={focusTrapRef}
        className={`relative h-full w-full max-w-md transform overflow-y-auto border-l border-default bg-surface-card p-6 shadow-2xl transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar username={user.username} size={64} />
            <div>
              <h3 id="user-drawer-title" className="text-lg font-semibold text-primary">
                {user.username}
              </h3>
              <p className="text-sm text-muted">
                {user.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(user.role)}`}
                >
                  {user.role}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(user.status)}`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-surface-elevated"
            aria-label="Close user details"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Account Info
          </h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted">User ID</dt>
              <dd className="font-mono text-primary">
                {user.userId}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Joined</dt>
              <dd className="text-primary">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Total Orders</dt>
              <dd className="text-primary">
                {user.orderCount ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Lifetime Spend</dt>
              <dd className="text-primary">
                {formatCurrency(user.totalSpent)}
              </dd>
            </div>
          </dl>
        </section>

        {user.addresses && user.addresses.length > 0 && (
          <section className="mb-6 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Saved Addresses
            </h4>
            <div className="space-y-2">
              {user.addresses.map((addr, idx) => (
                <div
                  key={addr.id || idx}
                  className="rounded-2xl border border-default bg-surface-elevated p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-surface-card px-2 py-0.5 text-xs font-medium uppercase text-secondary dark:bg-surface">
                      {addr.label || "Address"}
                    </span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-primary">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}
                    {addr.state ? `, ${addr.state}` : ""}, {addr.country}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;