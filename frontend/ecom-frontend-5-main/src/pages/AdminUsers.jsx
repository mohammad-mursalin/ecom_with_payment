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
      const response = await API.get("/api/admin/users");
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
      await API.delete(`/api/admin/users/${userId}`);
      showToast("User deleted successfully");
      setUsers(users.filter(u => u.userId !== userId));
    } catch (err) {
      showToast("Failed to delete user: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <div className="text-center mt-4">Loading users...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.userId}>
              <td>{user.userId}</td>
              <td>{user.email}</td>
              <td>
                <span className={`badge ${user.role === "ADMIN" ? "bg-danger" : "bg-success"}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(user.userId, user.email)}
                  disabled={user.role === "ADMIN"} // Prevent deleting admin users (optional)
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="text-muted">No users found.</p>
      )}
    </div>
  );
};

export default AdminUsers;
