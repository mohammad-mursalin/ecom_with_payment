// src/pages/UnauthorizedPage.jsx
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div className="container text-center py-5">
    <h2>Access Denied</h2>
    <p className="text-muted">You do not have permission to view this page.</p>
    <Link to="/" className="btn btn-primary">Go Home</Link>
  </div>
);

export default UnauthorizedPage;