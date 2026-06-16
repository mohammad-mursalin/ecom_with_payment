import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../components/Toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const lockoutTimerRef = useRef(null);

  const { login, isAuthenticated } = useAuth();
  const toast = useToast().toast;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    lockoutTimerRef.current = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(lockoutTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(lockoutTimerRef.current);
  }, [lockoutSeconds]);

  const isLockedOut = lockoutSeconds > 0;
  const tooManyAttempts = failedAttempts >= 5;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (tooManyAttempts || isLockedOut) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      const count = failedAttempts + 1;
      setFailedAttempts(count);

      const msg = err.response?.data?.message
        || err.response?.data?.error
        || "Invalid email or password.";

      if (count >= 5) {
        setLockoutSeconds(30);
        setError("Too many failed attempts. Please wait 30 seconds before trying again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password reset coming soon! Please contact support.");
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4">Login</h2>
      <div onKeyDown={handleKeyDown} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="email-input">Email</label>
          <input
            id="email-input"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="password-input">Password</label>
          <div className="input-group">
            <input
              id="password-input"
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
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
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Remember me
            </label>
          </div>
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={handleForgotPassword}
          >
            Forgot password?
          </button>
        </div>

        {error && <div className="alert alert-danger" id="login-error" role="alert">{error}</div>}

        <button
          type="button"
          className="btn btn-primary w-100"
          onClick={handleSubmit}
          disabled={loading || isLockedOut || tooManyAttempts}
        >
          {loading ? "Logging in..." : isLockedOut ? `Try again in ${lockoutSeconds}s` : "Login"}
        </button>
      </div>
      <p className="mt-3 text-center">
        Don&apos;t have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
