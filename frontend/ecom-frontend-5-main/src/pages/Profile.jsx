import React, { useEffect, useState } from "react";
import API from "../axios";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      showToast("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      const msg = error.response?.data?.message || "Failed to update profile";
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || "",
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      address: user?.address || "",
      bio: user?.bio || "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <h3 className="text-muted">Loading profile...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "80px", maxWidth: "800px" }}>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-circle" style={{ fontSize: "1.5rem" }}></i>
            <h4 className="mb-0">My Profile</h4>
          </div>
          {!isEditing && (
            <button
              className="btn btn-light btn-sm"
              onClick={() => setIsEditing(true)}
            >
              <i className="bi bi-pencil-square me-1"></i>
              Edit Profile
            </button>
          )}
        </div>
        <div className="card-body">
          {!isEditing ? (
            <div>
              <div className="text-center mb-4">
                {user.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt="Profile"
                    className="rounded-circle shadow"
                    style={{ width: "120px", height: "120px", objectFit: "cover", border: "4px solid #0d6efd" }}
                  />
                ) : (
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: "120px",
                      height: "120px",
                      backgroundColor: "#0d6efd",
                      color: "#fff",
                      fontSize: "3rem",
                      fontWeight: "bold",
                    }}
                  >
                    {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <h6 className="text-muted mb-0">Email</h6>
                </div>
                <div className="col-md-8">
                  <p className="mb-0 fw-semibold">{user.email}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <h6 className="text-muted mb-0">Full Name</h6>
                </div>
                <div className="col-md-8">
                  <p className="mb-0">{user.fullName || <span className="text-muted">Not set</span>}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <h6 className="text-muted mb-0">Phone</h6>
                </div>
                <div className="col-md-8">
                  <p className="mb-0">{user.phoneNumber || <span className="text-muted">Not set</span>}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <h6 className="text-muted mb-0">Address</h6>
                </div>
                <div className="col-md-8">
                  <p className="mb-0">{user.address || <span className="text-muted">Not set</span>}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <h6 className="text-muted mb-0">Bio</h6>
                </div>
                <div className="col-md-8">
                  <p className="mb-0">{user.bio || <span className="text-muted">Not set</span>}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <h6 className="text-muted mb-0">Role</h6>
                </div>
                <div className="col-md-8">
                  <span className={`badge ${user.role === "ADMIN" ? "bg-danger" : "bg-primary"}`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-envelope me-2"></i>Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-person me-2"></i>Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  className="form-control"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-telephone me-2"></i>Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  className="form-control"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-geo-alt me-2"></i>Address
                </label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-card-text me-2"></i>Bio
                </label>
                <textarea
                  name="bio"
                  className="form-control"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
