import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useCart } from "../Context/CartContext";
import { useToast } from "./Toast";
import { useAuth } from "../Context/AuthContext";
import { useWishlist } from "../Context/WishlistContext";
import { ShoppingBasket, Heart, Star } from "lucide-react";

function FractionalStars({ rating, count }) {
  const fullStars = Math.floor(rating || 0);
  const decimal = (rating || 0) - fullStars;
  const emptyStars = 5 - fullStars - (decimal > 0 ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
         {[...Array(fullStars)].map((_, i) => (
           <Star key={`full-${i}`} className="w-4 h-4 fill-warning text-warning" />
         ))}
         {decimal > 0 && (
           <span className="relative inline-flex">
             <Star className="w-4 h-4 text-muted" />
             <span className="absolute inset-0 overflow-hidden" style={{ width: `${decimal * 100}%` }}>
               <Star className="w-4 h-4 fill-warning text-warning" />
             </span>
           </span>
         )}
        {[...Array(Math.max(0, emptyStars))].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-muted" />
        ))}
      </div>
      <span className="text-xs text-muted">
        {(count ?? 0) === 0 ? "(No reviews yet)" : `(${count} reviews)`}
      </span>
    </div>
  );
}

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { isInWishlist, toggle } = useWishlist();

  const {
    id,
    name,
    brand,
    price,
    originalPrice,
    primaryImageUrl,
    averageRating,
    reviewCount,
    stock,
  } = product || {};

  const inWishlist = product ? isInWishlist(id) : false;
  const outOfStock = product ? stock === 0 : true;
  const lowStock = product ? stock > 0 && stock <= 5 : false;

  const getStockBadgeClass = () => {
    if (outOfStock) return "bg-danger";
    if (lowStock) return "bg-warning";
    return "bg-success";
  };

  const getStockLabel = () => {
    if (outOfStock) return "Out of Stock";
    if (lowStock) return "Low Stock";
    return "In Stock";
  };

  const discountPercent = useMemo(() => {
    if (!product) return 0;
    if (originalPrice && originalPrice > price && originalPrice > 0) {
      return Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    return 0;
  }, [product, originalPrice, price]);

  if (!product) return null;

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Please login to save items to your wishlist");
      navigate("/login");
      return;
    }
    try {
      await toggle(id);
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    if (!isAuthenticated) {
      toast.info("Please login to add items to your cart");
      navigate("/login");
      return;
    }
    try {
      await addItem(id, 1);
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Couldn't add to cart. Please try again.");
    }
  };

   const handleCardClick = () => {
     navigate(`/products/${id}`);
   };
   return (
     <div className="group rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none flex flex-col h-full">
<div className="relative aspect-square overflow-hidden bg-surface">
          <span
            className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium text-white rounded-full ${getStockBadgeClass()}`}
          >
            {getStockLabel()}
          </span>
          <img
          src={primaryImageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
          alt={name || "Product"}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03] cursor-pointer"
          onClick={handleCardClick}
        />
        <button
          type="button"
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-gray-900 transition-colors"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-4 h-4 ${inWishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`}
          />
        </button>
      </div>

      <div className="flex flex-col flex-1">
        <div className="mb-2">
          <span className="text-xs font-medium text-secondary uppercase tracking-wide">
            {brand?.name || "Brand"}
          </span>
        </div>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2 leading-snug min-h-[44px]">
          <button
            type="button"
            onClick={handleCardClick}
            className="text-left hover:text-primary font-medium transition-colors"
          >
            {name || "Product"}
          </button>
        </h3>

        <div className="mb-3">
          <FractionalStars rating={averageRating} count={reviewCount} />
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-4 flex-wrap">
            <span className="text-xl font-bold text-primary">
              ₹{Number(price || 0).toFixed(2)}
            </span>
            {originalPrice && originalPrice > price && (
              <>
                <span className="text-sm text-muted line-through">
                  ₹{Number(originalPrice).toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-danger bg-danger/10 px-2.5 py-0.5 rounded-full">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
              outOfStock
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed transition-colors"
                : "bg-primary hover:bg-primary-hover text-white shadow-sm transition-colors hover:shadow-md dark:shadow-none"
            }`}
          >
            <ShoppingBasket className="w-5 h-5" />
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;