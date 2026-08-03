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
      <section className="py-5 md:py-6 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <Skeleton width="180px" height="24px" rounded />
            <Skeleton width="100px" height="16px" rounded />
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 rounded-2xl overflow-hidden border border-default bg-surface-card">
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
      <section className="py-5 md:py-6 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <section className="py-5 md:py-6 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="text-2xl font-bold text-primary mb-0">Recently Viewed</h2>
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-2 text-muted hover:text-primary font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear history
          </button>
        </div>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/products/${item.id}`)}
              className="flex-shrink-0 w-44 rounded-2xl overflow-hidden border border-default bg-surface-card"
            >
              <div className="bg-surface h-36">
                <img
                  src={item.primaryImageUrl || "https://via.placeholder.com/160x128?text=No+Image"}
                  alt={item.name || "Product"}
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium mb-1 md:mb-2 line-clamp-2 text-primary">
                  {item.name || "Untitled"}
                </p>
                <p className="mb-0 font-semibold text-primary">
                  ৳{Number(item.price || 0).toFixed(2)}
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