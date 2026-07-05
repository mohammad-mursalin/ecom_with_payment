// src/pages/UnauthorizedPage.jsx
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

const UnauthorizedPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
    <div className="mb-6 rounded-full bg-danger/10 p-4">
      <Lock className="h-16 w-16 text-danger" />
    </div>
    <h2 className="mb-3 text-2xl font-bold text-primary">Access Denied</h2>
    <p className="mb-6 text-center text-sm text-secondary">
      You do not have permission to view this page.
    </p>
    <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover dark:shadow-none">
      Go Home
    </Link>
  </div>
);

export default UnauthorizedPage;