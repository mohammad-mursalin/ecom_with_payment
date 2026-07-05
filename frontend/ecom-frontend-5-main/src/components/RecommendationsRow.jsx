import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { getRelated, getAlsoBought } from "../services/productService";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import ErrorState from "./ErrorState";

const RecommendationsRow = ({ productId, type = "related" }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFn = useMemo(() => {
    if (!productId) return null;
    return type === "also-bought" ? getAlsoBought : getRelated;
  }, [productId, type]);

  const fetchItems = useCallback(async () => {
    if (!fetchFn) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchFn(productId);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load recommendations";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, productId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) {
    return (
    <section className="py-12 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 rounded mb-6 bg-surface-elevated animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Failed to load recommendations"
            message={error}
            onRetry={fetchItems}
          />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  const heading = type === "also-bought" ? "Customers Also Bought" : "You May Also Like";

  return (
    <section className="py-12 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">{heading}</h2>
          <Link
            to="/products"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendationsRow;
