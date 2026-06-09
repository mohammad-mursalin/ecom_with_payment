import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../axios";
import { useAuth } from "../Context/AuthContext";
import AdminUsers from "./AdminUsers";
import AdminOrders from "./AdminOrders";
import { LayoutDashboard, Users, ShoppingBag, TrendingUp, Package, Settings, Activity, BarChart3, Home, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/unauthorized");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, ordersRes] = await Promise.all([
          API.get("/admin/users"),
          API.get("/admin/orders")
        ]);
        setStats({
          totalUsers: usersRes.data?.length || 0,
          totalOrders: ordersRes.data?.length || 0,
          totalRevenue: ordersRes.data?.reduce((sum, o) => sum + o.totalAmount, 0) || 0
        });
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    fetchStats();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="empty-state">
          <LayoutDashboard className="empty-state-icon text-blue-600" />
          <h2 className="empty-state-title">Loading...</h2>
          <p className="empty-state-description">Please wait while we load the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="page-header">
            <div>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">Manage your store and track performance</p>
            </div>
            <Link
              to="/"
              className="btn btn-modern btn-modern-outline"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Store
            </Link>
          </div>

          <div className="admin-stats">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="admin-stat-card"
            >
              <div className="admin-stat-card-icon bg-gradient-to-br from-blue-500 to-blue-600">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="admin-stat-card-title">Total Users</h3>
              <div className="admin-stat-card-value">{stats.totalUsers}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="admin-stat-card"
            >
              <div className="admin-stat-card-icon bg-gradient-to-br from-green-500 to-green-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="admin-stat-card-title">Total Orders</h3>
              <div className="admin-stat-card-value">{stats.totalOrders}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="admin-stat-card"
            >
              <div className="admin-stat-card-icon bg-gradient-to-br from-purple-500 to-purple-600">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="admin-stat-card-title">Total Revenue</h3>
              <div className="admin-stat-card-value">₹{stats.totalRevenue.toFixed(2)}</div>
            </motion.div>
          </div>

          <div className="card">
            <div className="admin-tabs">
              <button
                className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                <Users className="w-5 h-5 mr-2" />
                Users Management
              </button>
              <button
                className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                <Activity className="w-5 h-5 mr-2" />
                Orders Management
              </button>
              <button
                className={`admin-tab ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                <Package className="w-5 h-5 mr-2" />
                Products
              </button>
              <button
                className={`admin-tab ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </button>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === "users" && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AdminUsers />
                  </motion.div>
                )}
                {activeTab === "orders" && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AdminOrders />
                  </motion.div>
                )}
                {activeTab === "products" && (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Products Management</h3>
                      <p className="text-gray-600 dark:text-gray-400">Manage your products inventory here</p>
                    </div>
                  </motion.div>
                )}
                {activeTab === "analytics" && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h3>
                      <p className="text-gray-600 dark:text-gray-400">View detailed analytics and reports here</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;