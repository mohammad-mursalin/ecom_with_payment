import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { getStats, getAnalytics, getOrders } from "../services/adminService";
import { getProducts } from "../services/productService";
import StatCardSkeleton from "../components/StatCardSkeleton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Home,
  DollarSign,
  Calendar,
  ShoppingBag,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StatCard = ({ icon: Icon, label, value, trend }) => {
  const isPositive = trend > 0;
  return (
    <div className="rounded-2xl border border-default bg-surface-card p-5 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-success" : "text-danger"}`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs text-muted">{label}</p>
      </div>
      <div className="mt-1">
        <p className="text-2xl font-semibold text-primary">
          {value}
        </p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersToday: 0,
    totalUsers: 0,
    activeProducts: 0,
    pendingOrders: 0,
    totalReviews: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");
  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/unauthorized");
    }
  }, [isAdmin, authLoading, navigate]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError("");
    try {
      const response = await getStats();
      const data = response.data?.data || response.data || response;
      setStats({
        totalRevenue: data.totalRevenue ?? 0,
        ordersToday: data.ordersToday ?? 0,
        totalUsers: data.totalUsers ?? 0,
        activeProducts: data.activeProducts ?? 0,
        pendingOrders: data.pendingOrders ?? 0,
        totalReviews: data.totalReviews ?? 0,
      });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to load stats";
      setStatsError(msg);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const [revRes, ordRes] = await Promise.all([
        getAnalytics(analyticsPeriod),
        getOrders({ page: 0, pageSize: 1 }),
      ]);

      const revData = revRes.data || revRes;
      setRevenueData(Array.isArray(revData) ? revData : []);

      const ordData = ordRes.data || ordRes;
      setOrdersData(Array.isArray(ordData) ? ordData : []);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to load analytics";
      setAnalyticsError(msg);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsPeriod]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const response = await getProducts({ size: 8 });
      const data = response.data || response;
      const content = data.content || data.items || [];
      setProducts(content);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to load products";
      setProductsError(msg);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LayoutDashboard className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-primary mb-2">
            Loading Admin Dashboard
          </h2>
          <p className="text-muted">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Admin Dashboard
            </h1>
            <p className="text-muted">
              Manage your store and track performance
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-default bg-surface-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-elevated"
          >
            <Home className="h-4 w-4" />
            Back to Store
          </Link>
        </div>

        <div className="mb-6 flex gap-1 border-b border-default">
          {["overview", "analytics", "products", "quicklinks"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-primary"
              }`}
            >
              {tab === "overview" && <LayoutDashboard className="h-4 w-4" />}
              {tab === "analytics" && <BarChart3 className="h-4 w-4" />}
              {tab === "products" && <Package className="h-4 w-4" />}
              {tab === "quicklinks" && <Zap className="h-4 w-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "overview" && (
            <div className="space-y-6">
              {statsError ? (
                <ErrorState message={statsError} onRetry={loadStats} />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {statsLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <StatCardSkeleton key={idx} />
                    ))
                  ) : (
                    <>
                      <StatCard
                        icon={DollarSign}
                        label="Total Revenue"
                        value={formatCurrency(stats.totalRevenue)}
                        trend={12}
                      />
                      <StatCard
                        icon={Calendar}
                        label="Orders Today"
                        value={stats.ordersToday}
                        trend={8}
                      />
                      <StatCard
                        icon={Users}
                        label="Total Users"
                        value={stats.totalUsers}
                        trend={5}
                      />
                      <StatCard
                        icon={Package}
                        label="Active Products"
                        value={stats.activeProducts}
                        trend={-2}
                      />
                      <StatCard
                        icon={ShoppingBag}
                        label="Pending Orders"
                        value={stats.pendingOrders}
                        trend={-3}
                      />
                      <StatCard
                        icon={Star}
                        label="Total Reviews"
                        value={stats.totalReviews}
                        trend={15}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">
                  Analytics
                </h2>
                <select
                  value={analyticsPeriod}
                  onChange={(e) => setAnalyticsPeriod(e.target.value)}
                  className="rounded-lg border border-default bg-surface-card px-3 py-1.5 text-sm text-primary"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>

              {analyticsError ? (
                <ErrorState message={analyticsError} onRetry={loadAnalytics} />
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-default bg-surface-card p-5">
                    <h3 className="mb-4 text-sm font-semibold text-secondary">
                      Revenue
                    </h3>
                    {analyticsLoading ? (
                      <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenueData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--color-border)"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="var(--text-muted)"
                              fontSize={12}
                            />
                            <YAxis
                              stroke="var(--text-muted)"
                              fontSize={12}
                              tickFormatter={(v) => `₹${v / 1000}k`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-surface-card)",
                                border: "1px solid var(--color-border)",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="amount"
                              stroke="var(--color-primary)"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-default bg-surface-card p-5">
                    <h3 className="mb-4 text-sm font-semibold text-secondary">
                      Orders
                    </h3>
                    {analyticsLoading ? (
                      <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ordersData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--color-border)"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="var(--text-muted)"
                              fontSize={12}
                            />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-surface-card)",
                                border: "1px solid var(--color-border)",
                              }}
                            />
                            <Bar dataKey="count" fill="var(--color-primary)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">
                  Products
                </h2>
                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/products"
                    className="inline-flex items-center gap-1 rounded-lg border border-default bg-surface-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-elevated"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View All Products
                  </Link>
                  <Link
                    to="/admin/products/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
                  >
                    <Package className="h-4 w-4" />
                    Add Product
                  </Link>
                </div>
              </div>

              {productsError ? (
                <ErrorState message={productsError} onRetry={loadProducts} />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-default bg-surface-card">
                  {productsLoading ? (
                    <div className="p-4">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="border-b border-default py-3 last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 animate-pulse rounded-lg bg-surface-elevated" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-3/4 animate-pulse rounded bg-surface-elevated" />
                              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-elevated" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title="No products found"
                      description="Get started by adding your first product."
                      actionLabel="Add Product"
                      actionHref="/admin/products/new"
                    />
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-default text-left text-xs font-semibold text-muted uppercase">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Stock</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-default hover:bg-surface-elevated"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {p.primaryImageUrl ? (
                                  <img
                                    src={p.primaryImageUrl}
                                    alt={p.name}
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-surface-elevated" />
                                )}
                                <span className="font-medium text-primary">
                                  {p.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-secondary">
                              {p.category?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-primary">
                              {formatCurrency(p.price)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`font-medium ${
                                  p.stockQuantity <= (p.lowStockThreshold || 5)
                                    ? "text-danger"
                                    : "text-success"
                                }`}
                              >
                                {p.stockQuantity ?? 0}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  p.isActive
                                    ? "bg-success/10 text-success"
                                    : "bg-surface-elevated text-muted"
                                }`}
                              >
                                {p.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/admin/products/${p.id}/edit`}
                                className="inline-flex items-center gap-1 rounded-lg border border-default bg-surface-card px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-surface-elevated"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "quicklinks" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/admin/users"
                className="flex items-center gap-4 rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="rounded-xl bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">
                    Manage Users
                  </h3>
                  <p className="text-sm text-muted">
                    View and manage user accounts
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/orders"
                className="flex items-center gap-4 rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="rounded-xl bg-warning/10 p-3">
                  <ShoppingBag className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">
                    Manage Orders
                  </h3>
                  <p className="text-sm text-muted">
                    View and update order status
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/products/new"
                className="flex items-center gap-4 rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="rounded-xl bg-success/10 p-3">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">
                    Add Product
                  </h3>
                  <p className="text-sm text-muted">
                    Create a new product listing
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
