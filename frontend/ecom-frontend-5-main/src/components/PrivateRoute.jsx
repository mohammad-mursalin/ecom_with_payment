import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import PageLoader from "./PageLoader";

const PrivateRoute = ({ admin = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (admin && user?.role !== "ADMIN") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;