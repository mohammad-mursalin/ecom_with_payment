import React, { useEffect, useState } from "react";
import API from "../axios";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Edit, Save, X, Star, Award, Shield, Settings, LogOut, Calendar, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="empty-state">
          <User className="empty-state-icon text-blue-600" />
          <h2 className="empty-state-title">Loading profile...</h2>
          <p className="empty-state-description">Please wait while we load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="page-header">
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your personal information and preferences</p>
          </div>
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="btn btn-modern btn-modern-primary"
            >
              <Edit className="w-5 h-5 mr-2" />
              Edit Profile
            </motion.button>
          )}
        </div>

        <div className="grid-container">
          <div className="profile-card">
            <div className="profile-header">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="profile-avatar"
              >
                {user.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt="Profile"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-4xl font-bold">
                    {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.div>
              <div className="mt-4">
                <div className={`profile-stat ${user.role === "ADMIN" ? 'admin' : 'user'}`}>
                  <Award className="w-4 h-4 mr-2" />
                  {user.role}
                </div>
              </div>
            </div>

            <div className="profile-info">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                  <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                    <p className="font-semibold">{user.fullName || <span className="text-gray-500">Not set</span>}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                    <p className="font-semibold">{user.phoneNumber || <span className="text-gray-500">Not set</span>}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address</p>
                    <p className="font-semibold">{user.address || <span className="text-gray-500">Not set</span>}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold">Account Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                    <p className="font-semibold">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Orders:</span>
                    <p className="font-semibold">
                      <Box className="w-4 h-4 inline mr-1" />
                      {user.orderCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="profile-card">
              <div className="profile-header">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                    <p className="text-blue-100">Update your personal information</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="form-label">
                    <User className="w-4 h-4 mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    className="form-input"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="form-label">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="form-label">
                    <Phone className="w-4 h-4 mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="form-input"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="form-label">
                    <MapPin className="w-4 h-4 mr-2" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    className="form-input"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                  />
                </div>

                <div>
                  <label className="form-label">
                    <Settings className="w-4 h-4 mr-2" />
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    className="form-input"
                    rows="4"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className="btn btn-modern btn-modern-primary flex-1"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="spinner spinner-sm"></div>
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="btn btn-modern btn-modern-outline"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;