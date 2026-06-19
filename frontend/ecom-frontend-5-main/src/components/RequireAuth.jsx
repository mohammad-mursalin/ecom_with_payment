// src/components/RequireAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

/**
 * Wraps a route and requires authentication.
 *
 * Props:
 *   children      — the protected component to render
 *   requireAdmin  — if true, user must also have role === 'ADMIN'
 *
 * Behavior:
 *   loading=true  → show spinner (prevents flash-of-login during session restore)
 *   not authenticated → redirect to /login, preserving the current path in state
 *   requireAdmin + not admin → redirect to /unauthorized
 *   otherwise → render children
 */
const RequireAuth = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // During the initial session restore, show a centered spinner.
  // This prevents the login redirect from flashing before auth state is known.
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '60vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Pass the current location in state so LoginPage can redirect back after login.
    // `replace` prevents the login page from appearing in browser history.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequireAuth;