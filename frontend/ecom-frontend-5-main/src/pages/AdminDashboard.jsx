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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
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
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <div className="mt-1">
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LayoutDashboard className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Admin Dashboard
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Please wait...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your store and track performance
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Home className="h-4 w-4" />
            Back to Store
          </Link>
        </div>

        <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {["overview", "analytics", "products", "quicklinks"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analytics
                </h2>
                <select
                  value={analyticsPeriod}
                  onChange={(e) => setAnalyticsPeriod(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
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
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Revenue
                    </h3>
                    {analyticsLoading ? (
                      <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenueData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#9ca3af"
                              fontSize={12}
                            />
                            <YAxis
                              stroke="#9ca3af"
                              fontSize={12}
                              tickFormatter={(v) => `₹${v / 1000}k`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="amount"
                              stroke="var(--color-brand)"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Orders
                    </h3>
                    {analyticsLoading ? (
                      <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ordersData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#9ca3af"
                              fontSize={12}
                            />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                              }}
                            />
                            <Bar dataKey="count" fill="var(--color-brand)" />
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Products
                </h2>
                <Link
                  to="/admin/products/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Package className="h-4 w-4" />
                  Add Product
                </Link>
              </div>

              {productsError ? (
                <ErrorState message={productsError} onRetry={loadProducts} />
              ) : (
                <div className="admin-table-container rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  {productsLoading ? (
                    <div className="p-4">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="border-b border-gray-100 py-3 last:border-0 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
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
                    <table className="admin-table text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                            Price
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                            Stock
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
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
                                  <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                )}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {p.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {p.category?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {formatCurrency(p.price)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`font-medium ${
                                  p.stockQuantity <= (p.lowStockThreshold || 5)
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {p.stockQuantity ?? 0}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  p.isActive
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {p.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/admin/products/${p.id}/edit`}
                                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Manage Users
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    View and manage user accounts
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/orders"
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900">
                  <ShoppingBag className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Manage Orders
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    View and update order status
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/products/new"
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="rounded-xl bg-green-100 p-3 dark:bg-green-900">
                  <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Add Product
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
