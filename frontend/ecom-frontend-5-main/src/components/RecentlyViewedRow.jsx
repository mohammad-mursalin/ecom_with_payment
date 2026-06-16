import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import Skeleton from "./Skeleton";
import ErrorState from "./ErrorState";

const RecentlyViewedRow = () => {
  const { items, loading, error, clearHistory, refresh } = useRecentlyViewed();
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="py-5 py-md-6" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4 mb-md-5">
            <Skeleton width="180px" height="24px" rounded />
            <Skeleton width="100px" height="16px" rounded />
          </div>
          <div className="d-flex gap-3 gap-md-4 overflow-auto pb-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 rounded-3 overflow-hidden border" style={{ width: "180px", backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
                <Skeleton height="140px" width="100%" />
                <div className="p-3">
                  <Skeleton width="100%" height="16px" rounded className="mb-2" />
                  <Skeleton width="60%" height="18px" rounded />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-5 py-md-6" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="container">
          <div className="text-center py-4">
            <ErrorState
              title="Failed to load recently viewed items"
              message={error}
              onRetry={refresh}
            />
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="py-5 py-md-6" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 mb-md-5">
          <h2 className="h3 fw-bold mb-0" style={{ color: "var(--text-primary)" }}>Recently Viewed</h2>
          <button
            type="button"
            onClick={clearHistory}
            className="btn btn-link text-decoration-none p-0 text-muted"
          >
            <Trash2 className="w-4 h-4" />
            Clear history
          </button>
        </div>
        <div className="d-flex gap-3 gap-md-4 overflow-auto pb-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/products/${item.id}`)}
              className="flex-shrink-0 rounded-3 overflow-hidden border w-100 w-md-auto"
              style={{ width: "180px", backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
            >
              <div className="bg-light" style={{ height: "140px" }}>
                <img
                  src={item.primaryImageUrl || "https://via.placeholder.com/160x128?text=No+Image"}
                  alt={item.name || "Product"}
                  loading="lazy"
                  className="w-100 h-100 object-fit-contain"
                />
              </div>
              <div className="p-3">
                <p className="small fw-medium mb-1 mb-md-2 text-truncate-2" style={{ color: "var(--text-primary)" }}>
                  {item.name || "Untitled"}
                </p>
                <p className="mb-0 fw-semibold" style={{ color: "var(--color-brand)" }}>
                  ₹{Number(item.price || 0).toFixed(2)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedRow;