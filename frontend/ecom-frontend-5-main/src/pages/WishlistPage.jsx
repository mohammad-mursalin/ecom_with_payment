import { useWishlist } from "../Context/WishlistContext";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import ErrorState from "../components/ErrorState";
import { Heart } from "lucide-react";

const WishlistPage = () => {
  const { items, loading: wishlistLoading, error: wishlistError } = useWishlist();

  if (wishlistLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Wishlist</h1>
            <p className="page-subtitle">Loading your wishlist...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (wishlistError) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Wishlist</h1>
            <p className="page-subtitle">Error loading wishlist</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <ErrorState
            title="Failed to load wishlist"
            message={wishlistError}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  const itemCount = Array.isArray(items) ? items.length : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Wishlist</h1>
          <p className="page-subtitle">
            {itemCount} {itemCount === 1 ? "item" : "items"} saved
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="wishlist-sort" className="text-sm text-gray-600 dark:text-gray-400">
            Sort by:
          </label>
          <select
            id="wishlist-sort"
            defaultValue="date_added"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="date_added">Date Added</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {itemCount === 0 ? (
        <div className="empty-state">
          <Heart className="empty-state-icon text-blue-600" />
          <h2 className="empty-state-title">Your wishlist is empty</h2>
          <p className="empty-state-description">
            Save items you love by clicking the heart icon on any product.
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = "/products")}
            className="btn btn-modern btn-modern-primary"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const product = item.product || item;
            return <ProductCard key={product.id || item.productId || item.id} product={product} />;
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;