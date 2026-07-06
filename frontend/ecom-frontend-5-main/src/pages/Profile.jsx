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

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#2563EB", "#7C3AED", "#DB2777", "#DC2626", "#EA580C",
    "#CA8A04", "#16A34A", "#0891B2", "#4F46E5", "#BE185D",
  ];
  return colors[Math.abs(hash) % colors.length];
}

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

  const passwordStrength =
    newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
      ? 3
      : newPassword.length >= 6
        ? 2
        : newPassword.length > 0
          ? 1
          : 0;
  const strengthLabel = passwordStrength === 3 ? "Strong" : passwordStrength === 2 ? "Good" : passwordStrength === 1 ? "Weak" : "";
  const strengthColorClass =
    passwordStrength === 3 ? "bg-success" : passwordStrength === 2 ? "bg-warning" : passwordStrength === 1 ? "bg-danger" : "bg-transparent";
  const strengthTextColorClass =
    passwordStrength === 3 ? "text-success" : passwordStrength === 2 ? "text-warning" : passwordStrength === 1 ? "text-danger" : "text-muted";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <UserIcon className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-primary">Loading profile...</h2>
          <p className="text-sm text-muted mt-2">Please wait while we load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">My Profile</h1>
          <p className="text-base text-secondary mt-1">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <div className="flex flex-col">
            <div className="flex flex-col items-center text-center gap-4 bg-surface-card rounded-2xl border border-default p-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: stringToColor(user.username || user.email) }}
              >
                <span>{initials(user.username || user.email)}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">{user.username || user.email}</h3>
                <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                  {user.role}
                </span>
              </div>
            </div>

            <nav className="flex flex-col gap-1 mt-4 w-full">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeSection === item.key ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-surface-elevated hover:text-primary'}
                  `}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div>
            {activeSection === SECTION_STATUS.personal && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-primary">Personal Info</h2>
                  <p className="text-sm text-muted mt-1">Update your profile details</p>
                </div>

                <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="profile-fullName">Full Name</label>
                      <input
                        id="profile-fullName"
                        type="text"
                        className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="profile-username">Username</label>
                      <input
                        id="profile-username"
                        type="text"
                        className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={user.username || ""}
                        readOnly
                      />
                      <span className="text-xs text-muted mt-1 block">Username cannot be changed after account creation</span>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="profile-email">Email</label>
                      <input
                        id="profile-email"
                        type="email"
                        className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={user.email || ""}
                        readOnly
                      />
                      <span className="text-xs text-muted mt-1 block">Contact support to change your email</span>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="profile-phone">Phone</label>
                      <input
                        id="profile-phone"
                        type="tel"
                        className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                      >
                        {savingProfile ? "Saving..." : "Save Changes"}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {activeSection === SECTION_STATUS.password && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-primary">Change Password</h2>
                  <p className="text-sm text-muted mt-1">Update your password regularly to keep your account safe.</p>
                </div>

                <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="profile-current-password">Current Password</label>
                      <div className="relative">
                        <input
                          id="profile-current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 pr-10 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary font-medium"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                        >
                          {showCurrentPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="profile-new-password">New Password</label>
                      <div className="relative">
                        <input
                          id="profile-new-password"
                          type={showNewPassword ? "text" : "password"}
                          className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 pr-10 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          aria-describedby="password-strength-profile"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary font-medium"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {strengthLabel && (
                        <div className="mt-2" id="password-strength-profile" role="status" aria-live="polite">
                          <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                            <div
                              role="progressbar"
                              aria-valuenow={(passwordStrength / 3) * 100}
                              aria-valuemin="0"
                              aria-valuemax="100"
                              className={`h-full rounded-full transition-colors ${strengthColorClass}`}
                              style={{ width: `${(passwordStrength / 3) * 100}%` }}
                            />
                          </div>
                          <small className={`text-xs font-medium ${strengthTextColorClass}`}>{strengthLabel}</small>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="profile-confirm-password">Confirm New Password</label>
                      <div className="relative">
                        <input
                          id="profile-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 pr-10 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          aria-describedby={passwordError ? "password-error-profile" : undefined}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary font-medium"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger" id="password-error-profile" role="alert">
                        {passwordError}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={passwordSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                    >
                      {passwordSaving ? "Updating..." : "Update Password"}
                    </motion.button>
                  </form>
                </div>
              </section>
            )}

            {activeSection === SECTION_STATUS.addresses && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-primary">Saved Addresses</h2>
                  <p className="text-sm text-muted mt-1">Manage your delivery addresses below.</p>
                </div>

                <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
                  {addressesError ? (
                    <ErrorState
                      title="Failed to load addresses"
                      message={addressesError}
                      onRetry={fetchAddresses}
                    />
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <span className="text-sm text-secondary">
                          {addressesLoading ? "Loading addresses..." : `${addresses.length} address${addresses.length === 1 ? "" : "es"}`}
                        </span>
                        {!editingAddressId && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                            onClick={() => resetAddressForm()}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Address
                          </button>
                        )}
                      </div>

                      {addressesLoading ? (
                        <div className="space-y-4 animate-pulse">
                          {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="rounded-xl border border-default bg-surface-card p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-5 w-16 rounded bg-surface-elevated" />
                                <div className="h-5 w-12 rounded bg-surface-elevated" />
                              </div>
                              <div className="h-4 w-3/4 rounded bg-surface-elevated mb-1" />
                              <div className="h-4 w-1/2 rounded bg-surface-elevated mb-1" />
                              <div className="h-4 w-1/3 rounded bg-surface-elevated" />
                            </div>
                          ))}
                        </div>
                      ) : editingAddressId ? (
                        <form onSubmit={handleCreateAddress} className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="text-sm font-medium text-secondary" htmlFor="address-label">Label</label>
                              <select
                                id="address-label"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                              <label className="text-sm font-medium text-secondary" htmlFor="address-fullName">Full Name</label>
                              <input
                                id="address-fullName"
                                type="text"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm.fullName}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-secondary" htmlFor="address-phone">Phone</label>
                              <input
                                id="address-phone"
                                type="tel"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm.phone}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-secondary" htmlFor="address-line1">Line 1</label>
                              <input
                                id="address-line1"
                                type="text"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm.line1}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, line1: e.target.value }))}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-secondary" htmlFor="address-line2">Line 2</label>
                              <input
                                id="address-line2"
                                type="text"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm.line2}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, line2: e.target.value }))}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-secondary" htmlFor="address-city">City</label>
                              <input
                                id="address-city"
                                type="text"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-secondary" htmlFor="address-state">State</label>
                              <input
                                id="address-state"
                                type="text"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm.state}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-secondary" htmlFor="address-pinCode">PIN Code</label>
                              <input
                                id="address-pinCode"
                                type="text"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm.pinCode}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, pinCode: e.target.value }))}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-secondary" htmlFor="address-country">Country</label>
                              <input
                                id="address-country"
                                type="text"
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm.country}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                                required
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="address-isDefault"
                                className="rounded border-default text-primary focus:ring-primary/20"
                                checked={addressForm.isDefault}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                              />
                              <label htmlFor="address-isDefault" className="text-sm font-medium text-secondary">Set as default</label>
                            </div>
                          </div>

                          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              disabled={addressSaving}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                            >
                              {addressSaving ? "Saving..." : editingAddressId ? "Save changes" : "Add Address"}
                            </motion.button>
                            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated" onClick={resetAddressForm}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : addresses.length === 0 ? (
                        <div className="text-center py-12">
                          <MapPin className="w-10 h-10 text-primary mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-primary">No saved addresses yet.</h3>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none mt-3"
                            onClick={() => resetAddressForm()}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Address
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {addresses.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`rounded-2xl bg-surface-card p-4 shadow-sm transition-shadow hover:shadow-md dark:shadow-none ${item.isDefault ? 'border-2 border-primary' : 'border border-default'}`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  {LABEL_ICON[item.label] || <MapPin className="w-4 h-4" />}
                                  <span className="font-semibold text-primary">{item.label}</span>
                                  {item.isDefault && (
                                    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-success/10 text-success">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="text-xs text-muted hover:text-primary font-medium p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
                                    onClick={() => handleEditAddress(item)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs text-danger font-medium p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                                    onClick={() => handleDeleteAddress(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  {!item.isDefault && (
                                    <button
                                      type="button"
                                      className="text-xs text-primary hover:text-primary-hover font-medium px-2 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
                                      onClick={() => handleSetDefault(item.id)}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Set Default
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 text-sm text-secondary">
                                <p className="font-semibold text-primary">{item.fullName}</p>
                                {item.phone && <p>{item.phone}</p>}
                                <p>{item.line1}</p>
                                {item.line2 && <p>{item.line2}</p>}
                                <p>{item.city}, {item.state} {item.pinCode}</p>
                                <p>{item.country}</p>
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
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-primary">Danger Zone</h2>
                  <p className="text-sm text-muted mt-1">Irreversible account actions</p>
                </div>

                <div className="rounded-2xl border border-danger bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
                  <div className="space-y-4">
                    <p className="text-sm text-secondary">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="delete-username">Confirm your username</label>
                      <input
                        id="delete-username"
                        type="text"
                        className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={deleteUsername}
                        onChange={(e) => setDeleteUsername(e.target.value)}
                        placeholder={user?.username || ""}
                        aria-describedby="delete-username-help"
                      />
                      <span id="delete-username-help" className="text-xs text-muted mt-1 block">Type your exact username to confirm.</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
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