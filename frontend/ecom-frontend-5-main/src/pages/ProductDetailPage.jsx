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
          <Star key={`full-${i}`} className="w-4 h-4 fill-warning text-warning" />
        ))}
        {decimal > 0 && (
          <span className="relative inline-flex">
            <Star className="w-4 h-4 text-muted" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(decimal, 0) * 100}%` }}>
              <Star className="w-4 h-4 fill-warning text-warning" />
            </span>
          </span>
        )}
        {[...Array(Math.max(0, emptyStars))].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-muted" />
        ))}
      </div>
      <span className="text-sm text-secondary">
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
       <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
     <div className="min-h-screen flex items-center justify-center bg-background px-4">
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
       <div className="min-h-screen flex items-center justify-center bg-background px-4">
         <div className="flex flex-col items-center justify-center text-center py-12">
           <Package className="w-16 h-16 text-primary mb-4" />
           <h2 className="text-2xl font-bold text-primary mb-2">Product not found</h2>
           <p className="text-base text-secondary mb-6 max-w-md">
             The product you are looking for does not exist or has been removed.
           </p>
           <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover">
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
     if (!isAuthenticated) {
       toast.info("Please login to add items to your cart");
       navigate("/login");
       return;
     }
     try {
       await addItem(product.id, quantity);
       toast.success("Added to cart");
     } catch (error) {
       toast.error("Failed to add to cart");
     }
   };

   const handleBuyNow = async () => {
     if (isOutOfStock) return;
     if (!isAuthenticated) {
       toast.info("Please login to add items to your cart");
       navigate("/login");
       return;
     }
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
       return <p className="text-secondary">No specifications available.</p>;
     }
     return (
       <div className="overflow-hidden rounded-xl border border-default">
         <table className="w-full text-sm">
           <tbody>
             {specs.map((spec, index) => (
               <tr
                 key={index}
                 className={index % 2 === 0 ? "bg-surface-card" : "bg-background"}
               >
                 <td className="px-4 py-3 font-medium text-secondary w-1/3">{spec.key}</td>
                 <td className="px-4 py-3 text-secondary">{spec.value}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     );
   };

   const renderShipping = () => (
     <div className="rounded-xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none space-y-3">
       <div className="flex items-start gap-3">
         <Truck className="w-5 h-5 text-primary mt-0.5" />
         <div>
           <p className="font-medium text-primary">Standard Delivery</p>
           <p className="text-sm text-secondary">
             {shippingEstimate
               ? `₹${Number(shippingEstimate ?? 0).toFixed(2)} - Estimated 3-7 business days`
               : "Estimated 3-7 business days"}
           </p>
         </div>
       </div>
       <div className="flex items-start gap-3">
         <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
         <div>
           <p className="font-medium text-primary">Easy Returns</p>
           <p className="text-sm text-secondary">
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
     <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         <nav className="flex items-center gap-2 text-sm text-secondary mb-6 flex-wrap">
           {breadcrumbs.map((crumb, index) => (
             <span key={index} className="flex items-center gap-2">
               {index > 0 && <ChevronRight className="w-3 h-3 text-muted" />}
               {crumb.href ? (
                 <a href={crumb.href} className="hover:text-primary">
                   {crumb.label}
                 </a>
               ) : (
                 <span className="text-primary font-medium truncate">
                   {crumb.label}
                 </span>
               )}
             </span>
           ))}
         </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-6 space-y-4">
             <div
               className="aspect-square w-full overflow-hidden rounded-2xl bg-surface"
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
                          ? "border-primary"
                          : "border-transparent hover:border-default"
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
               <p className="text-sm font-medium text-muted uppercase tracking-wide mb-1">
                 {product.brand?.name || "Brand"}
               </p>
               <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-snug">{product.name}</h1>
               <div className="mt-2">
                 <FractionalStars rating={product.averageRating ?? 0} count={product.reviewCount ?? 0} />
               </div>
             </div>

             <div className="flex flex-wrap items-center gap-3">
               <span className="text-3xl font-bold text-primary">
                 ₹{Number(product.price ?? 0).toFixed(2)}
               </span>
               {discountPercent > 0 && (
                 <>
                   <span className="text-sm text-muted line-through">
                     ₹{Number(product.originalPrice).toFixed(2)}
                   </span>
                   <span className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
                     {discountPercent}% off
                   </span>
                 </>
               )}
             </div>

             <div className="flex items-center gap-2">
               {isOutOfStock ? (
                 <span className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">Out of Stock</span>
               ) : lowStock ? (
                 <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                   Low Stock ({product.stock} left)
                 </span>
               ) : (
                 <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                   In Stock ({product.stock} left)
                 </span>
               )}
             </div>

             {!isOutOfStock && (
               <div className="flex items-center gap-3">
                 <div className="flex items-center rounded-full border border-default overflow-hidden">
                   <button
                     type="button"
                     onClick={() => handleQuantityChange(-1)}
                     disabled={quantity <= 1}
                     className="px-3 py-2 text-secondary hover:bg-surface-elevated disabled:opacity-40"
                   >
                     <Minus className="w-4 h-4" />
                   </button>
                   <input
                     type="number"
                     min={1}
                     max={product.stock}
                     value={quantity}
                     onChange={handleQuantityInput}
                     className="w-16 border-x border-default bg-transparent text-center py-2 text-sm text-primary"
                   />
                   <button
                     type="button"
                     onClick={() => handleQuantityChange(1)}
                     disabled={quantity >= product.stock}
                     className="px-3 py-2 text-secondary hover:bg-surface-elevated disabled:opacity-40"
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
                 className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
               >
                 <ShoppingBasket className="w-5 h-5" />
                 Add to Cart
               </button>
               <button
                 type="button"
                 onClick={handleBuyNow}
                 disabled={isOutOfStock}
                 className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Buy Now
               </button>
             </div>

             <button
               type="button"
               onClick={handleWishlist}
               className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
             >
               <Heart className={`w-4 h-4 ${inWishlist ? "fill-danger text-danger" : "text-muted"}`} />
               {inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
             </button>

             <div className="flex items-center gap-4 text-sm text-muted">
               <span className="flex items-center gap-1">
                 <Tag className="w-4 h-4" /> SKU: {product.sku || "N/A"}
               </span>
             </div>

             <div className="flex items-center gap-4 text-sm text-muted">
               <span className="flex items-center gap-1">
                 <Package className="w-4 h-4" /> Brand: {product.brand?.name || "N/A"}
               </span>
             </div>
          </div>
        </div>

         <div className="mt-10">
           <div className="border-b border-default flex gap-6 overflow-x-auto pb-3">
             {TABS.map((tab) => (
               <button
                 key={tab.id}
                 type="button"
                 onClick={() => setActiveTab(tab.id)}
                 className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                   activeTab === tab.id
                     ? "border-primary text-primary"
                     : "border-transparent text-secondary hover:text-primary"
                 }`}
               >
                 {tab.label}
               </button>
             ))}
           </div>

           <div className="mt-6">
             {activeTab === "description" && product.description && (
               <p className="text-secondary leading-relaxed whitespace-pre-line">
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