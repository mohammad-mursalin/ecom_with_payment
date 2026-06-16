import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../components/Toast";
import { checkUsername, checkEmail } from "../services/authService";

const PASSWORD_RULES = [
  { label: "Min 8 characters", test: (v) => v.length >= 8 },
  { label: "1 uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "1 number", test: (v) => /\d/.test(v) },
  { label: "1 special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const USERNAME_RE = /^[A-Za-z0-9_]+$/;

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [emailStatus, setEmailStatus] = useState("idle");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const toast = useToast().toast;
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const usernameTimerRef = useRef(null);
  const emailTimerRef = useRef(null);

  const validateUsername = useCallback((value) => {
    if (!value) return "Username is required";
    if (value.length < 3) return "Must be at least 3 characters";
    if (value.length > 30) return "Must be at most 30 characters";
    if (!USERNAME_RE.test(value)) return "Alphanumeric and underscore only";
    return "";
  }, []);

  const validateEmail = useCallback((value) => {
    if (!value) return "Email is required";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return "Invalid email format";
    return "";
  }, []);

  const passwordStrength = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const strengthLabel = passwordStrength <= 1 ? "Weak" : passwordStrength === 2 ? "Fair" : passwordStrength === 3 ? "Good" : "Strong";
  const strengthColor = passwordStrength <= 1 ? "var(--color-danger)" : passwordStrength === 2 ? "var(--color-yellow)" : passwordStrength === 3 ? "var(--color-brand)" : "var(--color-success)";

  const isFormValid =
    username &&
    email &&
    password &&
    confirmPassword &&
    !usernameError &&
    !emailError &&
    !passwordError &&
    !confirmError &&
    passwordStrength >= 3 &&
    password === confirmPassword &&
    usernameStatus !== "checking" &&
    emailStatus !== "checking";

  useEffect(() => {
    return () => {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    };
  }, []);

  const runUsernameCheck = useCallback(
    async (value) => {
      const err = validateUsername(value);
      setUsernameError(err);
      if (err) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus("checking");
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
      usernameTimerRef.current = setTimeout(async () => {
        try {
          const available = await checkUsername(value);
          setUsernameStatus(available ? "available" : "taken");
        } catch {
          setUsernameStatus("idle");
        }
      }, 500);
    },
    [validateUsername]
  );

  const runEmailCheck = useCallback(
    async (value) => {
      const err = validateEmail(value);
      setEmailError(err);
      if (err) {
        setEmailStatus("idle");
        return;
      }
      setEmailStatus("checking");
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
      emailTimerRef.current = setTimeout(async () => {
        try {
          const available = await checkEmail(value);
          setEmailStatus(available ? "available" : "taken");
        } catch {
          setEmailStatus("idle");
        }
      }, 500);
    },
    [validateEmail]
  );

  useEffect(() => {
    runUsernameCheck(username);
  }, [username, runUsernameCheck]);

  useEffect(() => {
    runEmailCheck(email);
  }, [email, runEmailCheck]);

  useEffect(() => {
    if (!password) {
      setPasswordError("Password is required");
      return;
    }
    const failed = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label);
    setPasswordError(failed.length ? failed[0] : "");
  }, [password]);

  useEffect(() => {
    if (!confirmPassword) {
      setConfirmError("Please confirm your password");
      return;
    }
    setConfirmError(password && confirmPassword !== password ? "Passwords do not match" : "");
  }, [confirmPassword, password]);

  const handleSubmit = async () => {
    setFormError("");
    if (!isFormValid) return;
    setSubmitting(true);
try {
       await register(username, email, password, confirmPassword, fullName);
       toast.success(`Welcome to Mursalin, ${username}!`);
       navigate("/");
     } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || "Registration failed";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const usernameHelper =
    usernameStatus === "checking"
      ? "Checking..."
      : usernameStatus === "available"
        ? "Available"
        : usernameStatus === "taken"
          ? "Already taken"
          : "";

  const usernameHelperColor =
    usernameStatus === "available" ? "green" : usernameStatus === "taken" ? "red" : "inherit";

  const emailHelper =
    emailStatus === "checking"
      ? "Checking..."
      : emailStatus === "available"
        ? "Available"
        : emailStatus === "taken"
          ? "Already taken"
          : "";

  const emailHelperColor =
    emailStatus === "available" ? "green" : emailStatus === "taken" ? "red" : "inherit";

  return (
    <div className="container mt-5" style={{ maxWidth: "480px" }}>
      <h2 className="mb-4">Create Account</h2>
      {formError && <div className="alert alert-danger">{formError}</div>}
      <div onKeyDown={handleKeyDown} noValidate>
        <div className="mb-3">
          <label className="form-label">Full Name (optional)</label>
          <input
            type="text"
            className="form-control"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="register-username">Username</label>
          <input
            id="register-username"
            type="text"
            className={`form-control ${usernameError ? "is-invalid" : usernameStatus === "available" ? "is-valid" : ""}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            required
            aria-invalid={!!usernameError}
            aria-describedby={usernameStatus === "checking" || usernameHelper ? "username-helper" : undefined}
          />
          <div id="username-helper" className="form-text" style={{ color: usernameHelperColor }}>
            {usernameHelper}
          </div>
          {usernameError && <div className="invalid-feedback" role="alert">{usernameError}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            className={`form-control ${emailError ? "is-invalid" : emailStatus === "available" ? "is-valid" : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={!!emailError}
            aria-describedby={emailStatus === "checking" || emailHelper ? "email-helper" : undefined}
          />
          <div id="email-helper" className="form-text" style={{ color: emailHelperColor }}>
            {emailHelper}
          </div>
          {emailError && <div className="invalid-feedback" role="alert">{emailError}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="register-password">Password</label>
          <div className="input-group">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              className={`form-control ${passwordError ? "is-invalid" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={!!passwordError}
              aria-describedby="password-strength"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {password && (
            <div className="mt-2" id="password-strength" role="status" aria-live="polite">
              <div className="progress" style={{ height: 6, background: "var(--skeleton-base)" }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-valuenow={(passwordStrength / 4) * 100}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style={{ width: `${(passwordStrength / 4) * 100}%`, background: strengthColor }}
                />
              </div>
              <small style={{ color: strengthColor }} className="text-capitalize">
                {strengthLabel}
              </small>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="register-confirm-password">Confirm Password</label>
          <div className="input-group">
            <input
              id="register-confirm-password"
              type={showConfirm ? "text" : "password"}
              className={`form-control ${confirmError ? "is-invalid" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-invalid={!!confirmError}
              aria-describedby={confirmError ? "confirm-password-error" : undefined}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          {confirmError && <small id="confirm-password-error" className="text-danger">{confirmError}</small>}
        </div>

        <button type="button" className="btn btn-success w-100" onClick={handleSubmit} disabled={!isFormValid || submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
      </div>
      <p className="mt-3 text-center">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;