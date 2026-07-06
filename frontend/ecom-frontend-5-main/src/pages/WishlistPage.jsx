import { useState, useMemo } from "react";
import { useWishlist } from "../Context/WishlistContext";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { Heart } from "lucide-react";

const SORT_OPTIONS = [
  { label: "Date Added", value: "date_added" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

const WishlistPage = () => {
  const [sortBy, setSortBy] = useState("date_added");
  const { items, loading: wishlistLoading, error: wishlistError } = useWishlist();

  const sortedItems = useMemo(() => {
    const list = Array.isArray(items) ? [...items] : [];
    switch (sortBy) {
      case "price_asc": {
        return list.sort((a, b) => {
          const priceA = Number((a.product || a)?.price || 0);
          const priceB = Number((b.product || b)?.price || 0);
          return priceA - priceB;
        });
      }
      case "price_desc": {
        return list.sort((a, b) => {
          const priceA = Number((a.product || a)?.price || 0);
          const priceB = Number((b.product || b)?.price || 0);
          return priceB - priceA;
        });
      }
      case "date_added":
      default:
        return list;
    }
  }, [items, sortBy]);

  const itemCount = sortedItems.length;

  if (wishlistLoading) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">My Wishlist</h1>
            <p className="mt-2 text-muted">Loading your wishlist...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (wishlistError) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">My Wishlist</h1>
            <p className="mt-2 text-muted">Error loading wishlist</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <ErrorState
              title="Failed to load wishlist"
              message={wishlistError}
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">My Wishlist</h1>
            <p className="mt-2 text-muted">
              {itemCount} {itemCount === 1 ? "item" : "items"} saved
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="wishlist-sort" className="text-sm text-secondary">Sort by:</label>
            <select
              id="wishlist-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-default bg-surface-card text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

      {itemCount === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love by clicking the heart icon on any product."
          actionLabel="Browse Products"
          actionHref="/products"
          onAction={() => {}}
        />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => {
              const product = item.product || item;
              return <ProductCard key={product.id || item.productId || item.id} product={product} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;