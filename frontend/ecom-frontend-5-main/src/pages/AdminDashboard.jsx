import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../axios";
import { useAuth } from "../Context/AuthContext";

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users"); // "users" or "orders"
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/unauthorized");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    // TODO: fetch stats if you want to display
    // const fetchStats = async () => {
    //   try {
    //     const [usersRes, ordersRes] = await Promise.all([
    //       API.get("/admin/users"),
    //       API.get("/admin/orders")
    //     ]);
    //     setStats({
    //       totalUsers: usersRes.data.length,
    //       totalOrders: ordersRes.data.length,
    //       totalRevenue: ordersRes.data.reduce((sum, o) => sum + o.totalAmount, 0)
    //     });
    //   } catch (error) {
    //     console.error("Failed to load stats", error);
    //   }
    // };
    // fetchStats();
  }, []);

  if (authLoading) {
    return <div className="container mt-5">Loading...</div>;
  }

  if (!isAdmin) {
    return null; // or redirect already happening
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>

      {/* Stats Cards */}
      {/* <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary mb-3">
            <div className="card-body">
              <h5 className="card-title">Total Users</h5>
              <p className="card-text display-6">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-success mb-3">
            <div className="card-body">
              <h5 className="card-title">Total Orders</h5>
              <p className="card-text display-6">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-info mb-3">
            <div className="card-body">
              <h5 className="card-title">Total Revenue</h5>
              <p className="card-text display-6">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === "users" && <AdminUsers />}
      {activeTab === "orders" && <AdminOrders />}
    </div>
  );
};

export default AdminDashboard;
