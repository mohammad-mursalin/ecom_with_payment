import { useEffect, useCallback, useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  MapPin,
  Edit,
  Shield,
  Plus,
  Home,
  Briefcase,
  Trash2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefault,
} from "../services/addressService";
import { deleteAccount } from "../services/authService";
import ErrorState from "../components/ErrorState";

const LABEL_OPTIONS = ["Home", "Work", "Other"];

const LABEL_ICON = {
  Home: <Home className="w-4 h-4" />,
  Work: <Briefcase className="w-4 h-4" />,
  Other: <Briefcase className="w-4 h-4" />,
};

const SECTION_STATUS = {
  personal: "personal",
  password: "password",
  addresses: "addresses",
  danger: "danger",
};

const Profile = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(SECTION_STATUS.personal);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState("");
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pinCode: "",
    country: "",
    isDefault: false,
  });
  const [addressSaving, setAddressSaving] = useState(false);

  const [deleteUsername, setDeleteUsername] = useState("");
  const [deleting, setDeleting] = useState(false);

  const initials = useCallback(
    (value = "") => {
      const source = value.trim();
      if (!source) return "U";
      const words = source.split(/\s+/);
      return (words[0][0] || source[0]).toUpperCase();
    },
    []
  );

  const avatarColor = useCallback((value = "") => {
    const colors = [
      "bg-blue-600",
      "bg-emerald-600",
      "bg-amber-600",
      "bg-rose-600",
      "bg-indigo-600",
      "bg-teal-600",
      "bg-pink-600",
      "bg-sky-600",
    ];
    const index = value.trim().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  }, []);

  const passwordStrength =
    newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
      ? 3
      : newPassword.length >= 6
        ? 2
        : newPassword.length > 0
          ? 1
          : 0;
  const strengthLabel = passwordStrength === 3 ? "Strong" : passwordStrength === 2 ? "Good" : passwordStrength === 1 ? "Weak" : "";
  const strengthColor =
    passwordStrength === 3 ? "var(--color-success)" : passwordStrength === 2 ? "var(--color-yellow)" : passwordStrength === 1 ? "var(--color-danger)" : "transparent";

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || user.username || "");
    setPhoneNumber(user.phoneNumber || "");
  }, [user]);

  const fetchAddresses = useCallback(async () => {
    setAddressesLoading(true);
    setAddressesError("");
    try {
      const data = await getAddresses();
      setAddresses(data || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load addresses";
      setAddressesError(msg);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === SECTION_STATUS.addresses) {
      fetchAddresses();
    }
  }, [activeSection, fetchAddresses]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ fullName, phoneNumber });
      toast.success("Profile updated successfully");
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to update profile";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: "Home",
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pinCode: "",
      country: "",
      isDefault: false,
    });
    setEditingAddressId(null);
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, addressForm);
        toast.success("Address updated successfully");
      } else {
        await createAddress(addressForm);
        toast.success("Address added successfully");
      }
      resetAddressForm();
      fetchAddresses();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to save address";
      toast.error(msg);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleEditAddress = (item) => {
    setAddressForm({
      label: item.label,
      fullName: item.fullName || "",
      phone: item.phone || "",
      line1: item.line1 || "",
      line2: item.line2 || "",
      city: item.city || "",
      state: item.state || "",
      pinCode: item.pinCode || "",
      country: item.country || "",
      isDefault: item.isDefault || false,
    });
    setEditingAddressId(item.id);
    setActiveSection(SECTION_STATUS.addresses);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await deleteAddress(id);
      toast.success("Address deleted successfully");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefault(id);
      toast.success("Default address updated");
      fetchAddresses();
    } catch {
      toast.error("Failed to update default address");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to update password";
      toast.error(msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteUsername !== (user?.username || "")) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      toast.info("Your account has been deleted.");
      navigate("/");
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to delete account";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const navItems = [
    { key: SECTION_STATUS.personal, label: "Personal Info", icon: <UserIcon className="w-4 h-4" /> },
    { key: SECTION_STATUS.password, label: "Change Password", icon: <Lock className="w-4 h-4" /> },
    { key: SECTION_STATUS.addresses, label: "Saved Addresses", icon: <MapPin className="w-4 h-4" /> },
    { key: SECTION_STATUS.danger, label: "Danger Zone", icon: <Shield className="w-4 h-4" /> },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="empty-state">
          <UserIcon className="empty-state-icon text-blue-600" />
          <h2 className="empty-state-title">Loading profile...</h2>
          <p className="empty-state-description">Please wait while we load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your personal information and preferences</p>
          </div>
        </div>

        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="profile-avatar-sidebar">
              <div className={`profile-avatar ${avatarColor(user.username)}`}>
                <span>{initials(user.username || user.email)}</span>
              </div>
              <div className="profile-avatar-info">
                <h3 className="font-bold">{user.username || user.email}</h3>
                <span className="profile-badge">{user.role}</span>
              </div>
            </div>

            <nav className="profile-nav">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`profile-nav-item ${activeSection === item.key ? "active" : ""}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="profile-content">
{activeSection === SECTION_STATUS.personal && (
               <section className="profile-section">
                 <div className="profile-section-header">
                   <h2>Personal Info</h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Update your profile details</p>
                 </div>

                 <div className="profile-card">
                   <form onSubmit={handleProfileSubmit} className="space-y-4">
                     <div>
                       <label className="form-label" htmlFor="profile-fullName">Full Name</label>
                       <input
                         id="profile-fullName"
                         type="text"
                         className="form-input"
                         value={fullName}
                         onChange={(e) => setFullName(e.target.value)}
                       />
                     </div>

                     <div>
                       <label className="form-label" htmlFor="profile-username">Username</label>
                       <input
                         id="profile-username"
                         type="text"
                         className="form-input"
                         value={user.username || ""}
                         readOnly
                       />
                       <span className="form-helper">Username cannot be changed after account creation</span>
                     </div>

                     <div>
                       <label className="form-label" htmlFor="profile-email">Email</label>
                       <input
                         id="profile-email"
                         type="email"
                         className="form-input"
                         value={user.email || ""}
                         readOnly
                       />
                       <span className="form-helper">Contact support to change your email</span>
                     </div>

                     <div>
                       <label className="form-label" htmlFor="profile-phone">Phone</label>
                       <input
                         id="profile-phone"
                         type="tel"
                         className="form-input"
                         value={phoneNumber}
                         onChange={(e) => setPhoneNumber(e.target.value)}
                       />
                     </div>

                     <div className="flex gap-3">
                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         type="submit"
                         disabled={savingProfile}
                         className="btn btn-modern btn-modern-primary"
                       >
                         {savingProfile ? "Saving..." : "Save Changes"}
                       </motion.button>
                     </div>
                   </form>
                 </div>
               </section>
             )}

            {activeSection === SECTION_STATUS.password && (
              <section className="profile-section">
                <div className="profile-section-header">
                  <h2>Change Password</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update your password regularly to keep your account safe.</p>
                </div>

                <div className="profile-card">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="form-label" htmlFor="profile-current-password">Current Password</label>
                      <div className="input-group">
                        <input
                          id="profile-current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          className="form-input"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="btn-outline-secondary"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                        >
                          {showCurrentPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="form-label" htmlFor="profile-new-password">New Password</label>
                      <div className="input-group">
                        <input
                          id="profile-new-password"
                          type={showNewPassword ? "text" : "password"}
                          className="form-input"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          aria-describedby="password-strength-profile"
                        />
                        <button
                          type="button"
                          className="btn-outline-secondary"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {strengthLabel && (
                        <div className="mt-2" id="password-strength-profile" role="status" aria-live="polite">
                          <div className="progress" style={{ height: 8, background: "var(--skeleton-base)" }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              aria-valuenow={(passwordStrength / 3) * 100}
                              aria-valuemin="0"
                              aria-valuemax="100"
                              style={{
                                width: `${(passwordStrength / 3) * 100}%`,
                                background: strengthColor,
                              }}
                            />
                          </div>
                          <small className="text-capitalize" style={{ color: strengthColor }}>
                            {strengthLabel}
                          </small>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label" htmlFor="profile-confirm-password">Confirm New Password</label>
                      <div className="input-group">
                        <input
                          id="profile-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          aria-describedby={passwordError ? "password-error-profile" : undefined}
                        />
                        <button
                          type="button"
                          className="btn-outline-secondary"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="alert-danger mb-0" id="password-error-profile" role="alert">
                        {passwordError}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={passwordSaving}
                      className="btn btn-modern btn-modern-primary"
                    >
                      {passwordSaving ? "Updating..." : "Update Password"}
                    </motion.button>
                  </form>
                </div>
              </section>
            )}

{activeSection === SECTION_STATUS.addresses && (
                <section className="profile-section">
                  <div className="profile-section-header">
                    <h2>Saved Addresses</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your delivery addresses below.</p>
                  </div>

                  <div className="profile-card">
                    {addressesError ? (
                      <ErrorState
                        title="Failed to load addresses"
                        message={addressesError}
                        onRetry={fetchAddresses}
                      />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {addressesLoading ? "Loading addresses..." : `${addresses.length} address${addresses.length === 1 ? "" : "es"}`}
                          </span>
                          {!editingAddressId && (
                            <button
                              type="button"
                              className="btn btn-modern btn-modern-primary"
                              onClick={() => resetAddressForm()}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add New Address
                            </button>
                          )}
                        </div>

{addressesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                              <div className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
                            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
                            <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                          </div>
                        ))}
                      </div>
                    ) : editingAddressId ? (
<form onSubmit={handleCreateAddress} className="address-form">
                         <div className="grid gap-3">
                           <div>
                             <label className="form-label" htmlFor="address-label">Label</label>
                             <select
                               id="address-label"
                               className="form-select"
                               value={addressForm.label}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                             >
                               {LABEL_OPTIONS.map((option) => (
                                 <option key={option} value={option}>
                                   {option}
                                 </option>
                               ))}
                             </select>
                           </div>

                           <div>
                             <label className="form-label" htmlFor="address-fullName">Full Name</label>
                             <input
                               id="address-fullName"
                               type="text"
                               className="form-input"
                               value={addressForm.fullName}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                               required
                             />
                           </div>

                           <div>
                             <label className="form-label" htmlFor="address-phone">Phone</label>
                             <input
                               id="address-phone"
                               type="tel"
                               className="form-input"
                               value={addressForm.phone}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                               required
                             />
                           </div>

                           <div>
                             <label className="form-label" htmlFor="address-line1">Line 1</label>
                             <input
                               id="address-line1"
                               type="text"
                               className="form-input"
                               value={addressForm.line1}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, line1: e.target.value }))}
                               required
                             />
                           </div>

                           <div>
                             <label className="form-label" htmlFor="address-line2">Line 2</label>
                             <input
                               id="address-line2"
                               type="text"
                               className="form-input"
                               value={addressForm.line2}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, line2: e.target.value }))}
                             />
                           </div>

                           <div>
                             <label className="form-label" htmlFor="address-city">City</label>
                             <input
                               id="address-city"
                               type="text"
                               className="form-input"
                               value={addressForm.city}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                               required
                             />
                           </div>

                           <div>
                             <label className="form-label" htmlFor="address-state">State</label>
                             <input
                               id="address-state"
                               type="text"
                               className="form-input"
                               value={addressForm.state}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                               required
                             />
                           </div>

                           <div>
                             <label className="form-label" htmlFor="address-pinCode">PIN Code</label>
                             <input
                               id="address-pinCode"
                               type="text"
                               className="form-input"
                               value={addressForm.pinCode}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, pinCode: e.target.value }))}
                               required
                             />
                           </div>

                           <div>
                             <label className="form-label" htmlFor="address-country">Country</label>
                             <input
                               id="address-country"
                               type="text"
                               className="form-input"
                               value={addressForm.country}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                               required
                             />
                           </div>

                           <div className="flex items-center gap-2">
                             <input
                               type="checkbox"
                               id="address-isDefault"
                               className="form-checkbox"
                               checked={addressForm.isDefault}
                               onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                             />
                             <label htmlFor="address-isDefault" className="form-label mb-0">Set as default</label>
                           </div>
                         </div>

                        <div className="flex gap-3 mt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={addressSaving}
                            className="btn btn-modern btn-modern-primary"
                          >
                            {addressSaving ? "Saving..." : editingAddressId ? "Save changes" : "Add Address"}
                          </motion.button>
                          <button type="button" className="btn btn-modern btn-modern-secondary" onClick={resetAddressForm}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : addresses.length === 0 ? (
                      <div className="empty-state-card">
                        <MapPin className="empty-state-icon text-blue-600 w-10 h-10 mb-2" />
                        <h3 className="empty-state-title">No saved addresses yet.</h3>
                        <button
                          type="button"
                          className="btn btn-modern btn-modern-primary mt-3"
                          onClick={() => resetAddressForm()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Address
                        </button>
                      </div>
) : (
                        <div className="address-list">
                        {addresses.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`address-card ${item.isDefault ? "border-blue-500" : ""}`}
                          >
                            <div className="address-card-header">
                              <div className="address-card-label">
                                {LABEL_ICON[item.label] || <MapPin className="w-4 h-4" />}
                                <strong>{item.label}</strong>
                                {item.isDefault && (
                                  <span className="badge bg-success text-white">Default</span>
                                )}
                              </div>
                              <div className="address-card-actions">
                                <button
                                  type="button"
                                  className="btn-outline-secondary btn-sm"
                                  onClick={() => handleEditAddress(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  className="btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteAddress(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                {!item.isDefault && (
                                  <button
                                    type="button"
                                    className="btn-outline-primary btn-sm"
                                    onClick={() => handleSetDefault(item.id)}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Set Default
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <strong>{item.fullName}</strong>
                              {item.phone && <div>{item.phone}</div>}
                              <div>{item.line1}</div>
                              {item.line2 && <div>{item.line2}</div>}
                              <div>
                                {item.city}, {item.state} {item.pinCode}
                              </div>
                              <div>{item.country}</div>
                            </div>
                          </motion.div>
                        ))}
                        </div>
                      )}
                      </>
                    )}
                  </div>
                </section>
            )}

{activeSection === SECTION_STATUS.danger && (
               <section className="profile-section">
                 <div className="profile-section-header">
                   <h2>Danger Zone</h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Irreversible account actions</p>
                 </div>

                 <div className="profile-card border-danger">
                   <div className="space-y-4">
                     <p className="text-sm text-gray-600 dark:text-gray-300">
                       Once you delete your account, there is no going back. Please be certain.
                     </p>
                     <div>
                       <label className="form-label" htmlFor="delete-username">Confirm your username</label>
                       <input
                         id="delete-username"
                         type="text"
                         className="form-input"
                         value={deleteUsername}
                         onChange={(e) => setDeleteUsername(e.target.value)}
                         placeholder={user?.username || ""}
                         aria-describedby="delete-username-help"
                       />
                       <span id="delete-username-help" className="form-helper">Type your exact username to confirm.</span>
                     </div>
                     <motion.button
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       className="btn-danger"
                       disabled={deleting || deleteUsername !== (user?.username || "")}
                       onClick={handleDeleteAccount}
                     >
                       {deleting ? "Deleting..." : "Delete My Account"}
                     </motion.button>
                   </div>
                 </div>
               </section>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;