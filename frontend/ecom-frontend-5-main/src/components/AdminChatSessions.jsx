import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { getChatSessions, getChatStats } from "../services/adminChatService";
import { MessageSquare, AlertTriangle, Search } from "lucide-react";
import Pagination from "../components/Pagination";
import TableRowSkeleton from "../components/TableRowSkeleton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

const STATUS_COLORS = {
  active: { bg: "var(--color-success)", text: "#ffffff" },
  expired: { bg: "var(--color-border)", text: "var(--text-primary)" },
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-default bg-surface-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-xl font-semibold text-primary">{value}</p>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminChatSessions() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  const searchQuery = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const escalatedOnly = searchParams.get("escalatedOnly") === "true";
  const hasUser = searchParams.get("hasUser") || "";
  const page = Number(searchParams.get("page") || "0");
  const pageSize = Number(searchParams.get("pageSize") || "20");

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getChatStats();
      setStats(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load stats";
      toast.error(msg);
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        pageSize,
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(escalatedOnly ? { escalatedOnly: true } : {}),
        ...(hasUser === "true" ? { hasUser: true } : hasUser === "false" ? { hasUser: false } : {}),
      };
      const data = await getChatSessions(params);
      const dataArr = data.content || data.data || [];
      setSessions(dataArr);
      setTotalElements(data.totalElements || dataArr.length);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load sessions";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, startDate, endDate, escalatedOnly, hasUser, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSessions();
  }, [searchQuery, startDate, endDate, escalatedOnly, hasUser, page, pageSize, fetchSessions]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const updateFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== "") next.set(key, value);
      else next.delete(key);
      next.delete("page");
      return next;
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    updateFilter("search", value);
  };

  const handlePageChange = (nextPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(nextPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newPageSize) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("pageSize", String(newPageSize));
      next.set("page", "0");
      return next;
    });
  };

  const clearFilters = () => {
    setSearchParams({ page: "0", pageSize: String(pageSize) });
  };

  if (statsLoading && !stats) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-primary">Chat History</h2>
          <p className="text-sm text-muted">Loading stats...</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 animate-pulse rounded-2xl bg-surface-elevated" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Chat History</h2>
          <p className="text-sm text-muted">View and inspect past chat sessions.</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={MessageSquare} label="Total Sessions" value={stats?.totalSessions ?? 0} />
        <StatCard icon={MessageSquare} label="Active Sessions" value={stats?.activeSessions ?? 0} />
        <StatCard icon={AlertTriangle} label="Escalated Sessions" value={stats?.escalatedSessions ?? 0} />
        <StatCard icon={MessageSquare} label="Total Messages" value={stats?.totalMessages ?? 0} />
      </div>

      <div className="mb-4 rounded-2xl border border-default bg-surface-card p-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Username..."
                className="w-full rounded-lg border border-default bg-surface-card py-2.5 pl-9 pr-4 text-sm text-primary placeholder:text-muted"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Escalated Only</label>
            <label className="flex items-center gap-2 rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={escalatedOnly}
                onChange={(e) => updateFilter("escalatedOnly", e.target.checked ? "true" : "")}
                className="h-4 w-4 rounded border-default text-primary focus:ring-primary"
              />
              Yes
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Has User</label>
            <select
              value={hasUser}
              onChange={(e) => updateFilter("hasUser", e.target.value)}
              className="w-full rounded-lg border border-default bg-surface-card px-3 py-2.5 text-sm text-primary"
            >
              <option value="">All</option>
              <option value="true">With User</option>
              <option value="false">Guest</option>
            </select>
          </div>
        </div>
        {(searchQuery || startDate || endDate || escalatedOnly || hasUser) && (
          <div className="mt-3">
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {loading && sessions.length === 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-default bg-surface-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default bg-surface-elevated text-left text-xs font-semibold text-muted uppercase">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Escalated</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {Array.from({ length: 8 }).map((_, idx) => (
                <TableRowSkeleton key={idx} columns={6} />
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load sessions"
          message={error}
          onRetry={fetchSessions}
        />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No sessions found"
          description="Try adjusting your filters or search criteria."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-default bg-surface-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default bg-surface-elevated text-left text-xs font-semibold text-muted uppercase">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Escalated</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {sessions.map((session) => {
                const statusColor = STATUS_COLORS[session.status] || { bg: "var(--color-border)", text: "var(--text-primary)" };
                return (
                  <tr
                    key={session.id}
                    className="cursor-pointer transition-colors hover:bg-surface-elevated"
                    onClick={() => navigate(`/admin/chat/${session.id}`)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                        >
                          {(session.username || "G").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-primary">
                            {session.username || "Guest"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-secondary">
                      {session.messageCount} message{session.messageCount !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        {(session.status || "").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {session.escalated ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-secondary">
                      {formatDate(session.lastActivityAt)}
                    </td>
                    <td className="px-4 py-4 text-secondary">
                      {formatDate(session.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminChatSessions;
