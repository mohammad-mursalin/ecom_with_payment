import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../components/Toast";
import { getUsers, updateUserRole, updateUserStatus } from "../services/adminService";
import { Users } from "lucide-react";
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
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  USER: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_BADGE = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  SUSPENDED: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
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
  return ROLE_BADGE[role] || "bg-gray-100 text-gray-600";
}

function getStatusBadgeClass(status) {
  return STATUS_BADGE[status] || "bg-gray-100 text-gray-600";
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>
        <div className="admin-table-container rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="admin-table text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
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
       <div className="page-container">
         <div className="max-w-5xl mx-auto">
           <ErrorState
             title="Failed to load users"
             message={error}
             onRetry={() => fetchUsers(currentPage, pageSize, searchQuery)}
           />
         </div>
       </div>
     );
   }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Users Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {totalElements === 0 ? 0 : currentPage * pageSize + 1}–
            {Math.min((currentPage + 1) * pageSize, totalElements)} of{" "}
            {totalElements} users
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={handleExportCsv}
            disabled={users.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <i className="bi bi-download" />
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
        <div className="admin-table-container rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="admin-table text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  User
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Role
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Joined
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((u) => {
                const self = isSelf(u.userId);
                return (
                  <tr
                    key={u.userId}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar username={u.username} size={36} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-900 dark:text-white">
                            {u.username}
                          </div>
                          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
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
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          onClick={() => handleViewUser(u)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                          <i className="bi bi-eye" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        {!self && (
                          <>
                            <button
                              onClick={() => handleStatusChange(u, u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")}
                              disabled={actionLoading}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                                u.status === "SUSPENDED"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300"
                              }`}
                            >
                              <i className={u.status === "SUSPENDED" ? "bi bi-check-circle" : "bi bi-x-circle"} />
                              <span className="hidden sm:inline">
                                {u.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(u, "DELETED")}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-60 dark:bg-red-900 dark:text-red-300"
                            >
                              <i className="bi bi-trash" />
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
        className={`relative h-full w-full max-w-md transform overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl transition-transform dark:border-gray-700 dark:bg-gray-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar username={user.username} size={64} />
            <div>
              <h3 id="user-drawer-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.username}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close user details"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <section className="mb-6 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Account Info
          </h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">User ID</dt>
              <dd className="font-mono text-gray-900 dark:text-white">
                {user.userId}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Joined</dt>
              <dd className="text-gray-900 dark:text-white">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Total Orders</dt>
              <dd className="text-gray-900 dark:text-white">
                {user.orderCount ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Lifetime Spend</dt>
              <dd className="text-gray-900 dark:text-white">
                {formatCurrency(user.totalSpent)}
              </dd>
            </div>
          </dl>
        </section>

        {user.addresses && user.addresses.length > 0 && (
          <section className="mb-6 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Saved Addresses
            </h4>
            <div className="space-y-2">
              {user.addresses.map((addr, idx) => (
                <div
                  key={addr.id || idx}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {addr.label || "Address"}
                    </span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
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