import React, { useState, useEffect } from "react";
import API from "../axios";
import { useToast } from "../components/Toast";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await API.get("/admin/users");
      setUsers(response.data.data || response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
      showToast("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }
    try {
      await API.delete(`/admin/users/${userId}`);
      showToast("User deleted successfully");
      setUsers(users.filter(u => u.userId !== userId));
    } catch (err) {
      showToast("Failed to delete user: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "80px", marginBottom: "40px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Admin User Management</h2>
        <div className="badge bg-info">
          {users.length} User{users.length !== 1 ? 's' : ''}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="bi bi-people" style={{ fontSize: "3rem", color: "#6c757d" }}></i>
          </div>
          <h4>No users found</h4>
          <p className="text-muted">There are no users to manage yet.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>User ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <span className="fw-semibold">{user.userId}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                           style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                        {user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="fw-semibold small">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === "ADMIN" ? "bg-danger" : "bg-success"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(user.userId, user.email)}
                      disabled={user.role === "ADMIN"}
                      title={user.role === "ADMIN" ? "Cannot delete admin users" : "Delete this user"}
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
