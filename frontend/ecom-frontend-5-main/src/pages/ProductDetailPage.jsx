import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../Context/AuthContext";
import { useWishlist } from "../Context/WishlistContext";
import { useCart } from "../Context/CartContext";
import { getProduct } from "../services/productService";
import { getShippingEstimate } from "../services/shippingService";
import RecommendationsRow from "../components/RecommendationsRow";
import ReviewsSection from "../components/ReviewsSection";
import RecentlyViewedRow from "../components/RecentlyViewedRow";
import ProductDetailSkeleton from "../components/ProductDetailSkeleton";
import ErrorState from "../components/ErrorState";
import {
  ShoppingBasket,
  Heart,
  Star,
  ChevronRight,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  Tag,
  Package,
} from "lucide-react";

const TABS = [
  { id: "description", label: "Description" },
  { id: "specifications", label: "Specifications" },
  { id: "reviews", label: "Reviews & Ratings" },
  { id: "shipping", label: "Shipping & Returns" },
];

function FractionalStars({ rating, count }) {
  const fullStars = Math.floor((rating ?? 0));
  const decimal = (rating ?? 0) - fullStars;
  const emptyStars = 5 - fullStars - (decimal > 0 ? 1 : 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {decimal > 0 && (
          <span className="relative inline-flex">
            <Star className="w-4 h-4 text-gray-300" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(decimal, 0) * 100}%` }}>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </span>
          </span>
        )}
        {[...Array(Math.max(0, emptyStars))].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {count == null || Number(count) === 0 ? "No reviews yet" : `(${Number(count)} reviews)`}
      </span>
    </div>
  );
}

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState(0);
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProduct(id);
      setProduct(data);
      setSelectedImage(0);
      setQuantity(1);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load product";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (isAuthenticated && product?.id) {
      const trackViewed = async () => {
        try {
          await fetch(`/api/users/me/recently-viewed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ productId: product.id }),
          });
        } catch {
          // silent fail
        }
      };
      trackViewed();
    }
  }, [isAuthenticated, product?.id]);

  useEffect(() => {
    if (product?.price) {
      const fetchEstimate = async () => {
        try {
          const data = await getShippingEstimate({ subtotal: product.price });
          setShippingEstimate(data);
        } catch {
          setShippingEstimate(null);
        }
      };
      fetchEstimate();
    }
  }, [product?.price]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <ErrorState
          title="Failed to load product"
          message={error}
          onRetry={() => fetchProduct()}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="empty-state">
          <Package className="empty-state-icon text-blue-600" />
          <h2 className="empty-state-title">Product not found</h2>
          <p className="empty-state-description">
            The product you are looking for does not exist or has been removed.
          </p>
          <Link to="/products" className="btn btn-modern btn-modern-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [];
  const primaryImage = images[selectedImage]?.url || product?.primaryImageUrl || "";
  const isOutOfStock = Number(product?.stock ?? 0) === 0;
  const lowStock = Number(product?.stock ?? 0) > 0 && Number(product?.stock ?? 0) <= 5;
  const inWishlist = product?.id ? isInWishlist(product.id) : false;

  const discountPercent = (() => {
    const original = product.originalPrice;
    const current = product.price;
    if (original && Number(original) > Number(current) && Number(original) > 0) {
      return Math.round(((Number(original) - Number(current)) / Number(original)) * 100);
    }
    return 0;
  })();

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      await addItem(product.id, quantity);
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    try {
      await addItem(product.id, quantity);
      navigate("/checkout");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = Number(prev) + delta;
      const max = Number(product.stock ?? 1);
      if (next < 1) return 1;
      if (next > max) return prev;
      return next;
    });
  };

  const handleQuantityInput = (event) => {
    const value = Number(event.target.value);
    const max = Number(product.stock ?? 1);
    if (Number.isNaN(value)) return;
    setQuantity(value < 1 ? 1 : value > max ? max : value);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.info("Please login to save items to your wishlist");
      navigate("/login");
      return;
    }
    try {
      await toggle(product.id);
      toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  const renderSpecifications = () => {
    const specs = Array.isArray(product.specifications) ? product.specifications : [];
    if (specs.length === 0) {
      return <p className="text-gray-600 dark:text-gray-300">No specifications available.</p>;
    }
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <tbody>
            {specs.map((spec, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900/40"}
              >
                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200 w-1/3">{spec.key}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderShipping = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
      <div className="flex items-start gap-3">
        <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Standard Delivery</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {shippingEstimate
              ? `₹${Number(shippingEstimate ?? 0).toFixed(2)} - Estimated 3-7 business days`
              : "Estimated 3-7 business days"}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Easy Returns</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Free returns within 30 days of delivery. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: product.category?.name || "Category", href: `/products?category=${product.category?.slug || ""}` },
    { label: product.name, href: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-6 flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-blue-600 dark:hover:text-blue-400">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-900 dark:text-white font-medium truncate max-w-[180px]">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-6 space-y-4">
            <div
              className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 cursor-zoom-in"
              style={{ aspectRatio: "1 / 1", maxHeight: "520px" }}
            >
              <img
                src={primaryImage}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image.id ?? index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? "border-blue-600"
                        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {product.brand?.name || "Brand"}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-snug">{product.name}</h1>
              <div className="mt-2">
                <FractionalStars rating={product.averageRating ?? 0} count={product.reviewCount ?? 0} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ₹{Number(product.price ?? 0).toFixed(2)}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    ₹{Number(product.originalPrice).toFixed(2)}
                  </span>
                  <span className="rounded-full bg-red-50 dark:bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-600">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
              {isOutOfStock ? (
                <span className="text-red-600 bg-red-50 dark:bg-red-900/30">Out of Stock</span>
              ) : lowStock ? (
                <span className="text-orange-600 bg-orange-50 dark:bg-orange-900/30">
                  Low Stock ({product.stock} left)
                </span>
              ) : (
                <span className="text-green-600 bg-green-50 dark:bg-green-900/30">
                  In Stock ({product.stock} left)
                </span>
              )}
            </div>

            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={handleQuantityInput}
                    className="w-16 border-x border-gray-200 dark:border-gray-700 bg-transparent text-center py-2 text-sm dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 transition-colors"
              >
                <ShoppingBasket className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:border-gray-300 dark:disabled:border-gray-700 disabled:text-gray-500 font-semibold py-3 transition-colors"
              >
                Buy Now
              </button>
            </div>

            <button
              type="button"
              onClick={handleWishlist}
              className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Heart className={`w-4 h-4 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
              {inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
            </button>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" /> SKU: {product.sku || "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" /> Brand: {product.brand?.name || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === "description" && product.description && (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}
            {activeTab === "specifications" && renderSpecifications()}
            {activeTab === "reviews" && (
              <ReviewsSection
                productId={product.id}
                isAuthenticated={isAuthenticated}
              />
            )}
            {activeTab === "shipping" && renderShipping()}
          </div>
        </div>

        <RecommendationsRow productId={product.id} type="related" />
        <RecommendationsRow productId={product.id} type="also-bought" />
        <RecentlyViewedRow />
      </div>
    </div>
  );
};

export default ProductDetailPage;