// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  const validate = () => {
    const errors = {};
    if (!username.trim()) errors.username = 'Username is required.';
    if (!email.trim()) errors.email = 'Email is required.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password, confirmPassword);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
        <h2 className="mb-6 text-center text-2xl font-bold text-primary">Create Account</h2>

        {apiError && (
          <div className="rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">
            {apiError}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="reg-username" className="text-sm font-medium text-secondary">
            Username
          </label>
          <input
            id="reg-username"
            type="text"
            className={`w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${fieldErrors.username ? 'border-danger' : ''}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            autoComplete="username"
            disabled={submitting}
          />
          {fieldErrors.username && (
            <p className="mt-1 text-sm text-danger">{fieldErrors.username}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="reg-email" className="text-sm font-medium text-secondary">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            className={`w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${fieldErrors.email ? 'border-danger' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={submitting}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-danger">{fieldErrors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="reg-password" className="text-sm font-medium text-secondary">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            className={`w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${fieldErrors.password ? 'border-danger' : ''}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            disabled={submitting}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-danger">{fieldErrors.password}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="reg-confirm" className="text-sm font-medium text-secondary">
            Confirm Password
          </label>
          <input
            id="reg-confirm"
            type="password"
            className={`w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${fieldErrors.confirmPassword ? 'border-danger' : ''}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            disabled={submitting}
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-sm text-danger">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : 'Create Account'}
        </button>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;