// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const RegisterPage = () => {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [fieldErrors,     setFieldErrors]     = useState({});
  const [apiError,        setApiError]        = useState('');

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  const validate = () => {
    const errors = {};
    if (!username.trim())                         errors.username        = 'Username is required.';
    if (!email.trim())                            errors.email           = 'Email is required.';
    if (!password)                                errors.password        = 'Password is required.';
    else if (password.length < 8)                 errors.password        = 'Password must be at least 8 characters.';
    if (password !== confirmPassword)             errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password, confirmPassword);
      // register() auto-logs the user in — tokens set, user state set
      // Do NOT redirect to /login — user is already authenticated
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
    <div
      className="d-flex justify-content-center align-items-center py-5"
      style={{ minHeight: '100vh' }}
    >
      <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '480px' }}>
        <h4 className="mb-4 text-center">Create Account</h4>

        {apiError && (
          <div className="alert alert-danger py-2" role="alert">
            {apiError}
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="reg-username" className="form-label">Username</label>
          <input
            id="reg-username"
            type="text"
            className={`form-control ${fieldErrors.username ? 'is-invalid' : ''}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            autoComplete="username"
            disabled={submitting}
          />
          {fieldErrors.username && (
            <div className="invalid-feedback">{fieldErrors.username}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="reg-email" className="form-label">Email</label>
          <input
            id="reg-email"
            type="email"
            className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={submitting}
          />
          {fieldErrors.email && (
            <div className="invalid-feedback">{fieldErrors.email}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="reg-password" className="form-label">Password</label>
          <input
            id="reg-password"
            type="password"
            className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            disabled={submitting}
          />
          {fieldErrors.password && (
            <div className="invalid-feedback">{fieldErrors.password}</div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
          <input
            id="reg-confirm"
            type="password"
            className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            disabled={submitting}
          />
          {fieldErrors.confirmPassword && (
            <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>
          )}
        </div>

        <button
          className="btn btn-primary w-100"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              Creating account...
            </>
          ) : 'Create Account'}
        </button>

        <p className="text-center mt-3 mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;