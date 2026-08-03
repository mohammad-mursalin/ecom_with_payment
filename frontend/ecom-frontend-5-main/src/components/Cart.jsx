import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../Context/AuthContext";
import { useCart } from "../Context/CartContext";
import { useWishlist } from "../Context/WishlistContext";
import { validateCoupon } from "../services/couponService";
import { getShippingEstimate } from "../services/shippingService";
import { ShoppingBasket, Plus, Minus, CreditCard, Heart } from "lucide-react";
import ProductCardSkeleton from "./ProductCardSkeleton";
import EmptyState from "./EmptyState";

const Cart = () => {
  const { items, subtotal, itemCount, updateItem, removeItem, loading, addItem } = useCart();
  const toast = useToast().toast;
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponStatus, setCouponStatus] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [stockWarnings, setStockWarnings] = useState({});
  const [shippingFee, setShippingFee] = useState(0);
  const [lastRemovedItem, setLastRemovedItem] = useState(null);

  const SHIPPING_FREE_THRESHOLD = 500;
  const TAX_RATE = 0.18;

  useEffect(() => {
    const fetchShippingEstimate = async () => {
      try {
        const estimate = await getShippingEstimate({ subtotal, method: 'STANDARD' });
        setShippingFee(estimate?.fee ?? 0);
      } catch {
        setShippingFee(subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : 50);
      }
    };
    if (subtotal > 0) {
      fetchShippingEstimate();
    }
  }, [subtotal]);

  const tax = subtotal * TAX_RATE;
  const discount = appliedCoupon ? (appliedCoupon.discountAmount || 0) : 0;
  const grandTotal = Math.max(subtotal + tax + shippingFee - discount, 0);

  useEffect(() => {
    const warnings = {};
    items.forEach((item) => {
      if (item.stock !== undefined && item.quantity > item.stock) {
        warnings[item.cartItemId] = `Only ${item.stock} left in stock. Quantity adjusted.`;
        updateItem(item.cartItemId, item.stock).catch(() => { });
      }
    });
    setStockWarnings(warnings);
  }, [items, updateItem]);

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    const qty = Math.max(1, Math.min(newQuantity, 999));
    await updateItem(cartItemId, qty);
  };

  const handleRemove = async (cartItemId) => {
    const itemToRemove = items.find((item) => item.cartItemId === cartItemId);
    setLastRemovedItem(itemToRemove);

    try {
      await removeItem(cartItemId);
    } catch (error) {
      setLastRemovedItem(null);
      toast.error("Failed to remove item");
    }
  };

  const handleUndoRemove = async () => {
    if (!lastRemovedItem) return;
    try {
      await addItem(lastRemovedItem.id, lastRemovedItem.quantity);
      toast.success("Item restored");
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Could not restore item";
      toast.error(msg);
    } finally {
      setLastRemovedItem(null);
    }
  };

  const { toggle } = useWishlist();

  const handleSaveForLater = async (item) => {
    if (!isAuthenticated) {
      toast.info("Please login to use wishlist");
      navigate("/login");
      return;
    }
    try {
      await toggle(item.id);
      toast.success("Saved for later");
      await removeItem(item.cartItemId);
    } catch (error) {
      toast.error("Failed to save item to wishlist");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMessage("");
    try {
      const result = await validateCoupon({ code: couponCode.trim(), orderSubtotal: subtotal });
      if (result.valid) {
        setAppliedCoupon(result);
        setCouponStatus("success");
        setCouponMessage(`Coupon applied: ৳${result.discountAmount.toFixed(2)} off`);
        toast.success("Coupon applied successfully");
      } else {
        setCouponStatus("error");
        setCouponMessage(result.message || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponStatus("error");
      const msg = error.response?.data?.message || error.response?.data?.error || "Invalid or expired coupon code";
      setCouponMessage(msg);
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    setCouponStatus(null);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login?returnUrl=/checkout");
      return;
    }
    navigate("/checkout");
  };

  useEffect(() => {
    if (!lastRemovedItem) return;
    const timer = setTimeout(() => {
      setLastRemovedItem(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastRemovedItem]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Shopping Cart</h1>
            <p className="mt-2 text-muted">Loading your cart...</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-default bg-surface-card p-4 shadow-sm">
                  <div className="rounded-xl overflow-hidden aspect-square bg-surface">
                    <ProductCardSkeleton />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm space-y-4">
                <div className="h-6 w-32 rounded bg-surface"></div>
                <div className="h-4 w-40 rounded bg-surface"></div>
                <div className="h-4 w-36 rounded bg-surface"></div>
                <div className="h-4 w-28 rounded bg-surface"></div>
                <div className="h-10 w-full rounded bg-surface"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Shopping Cart</h1>
          <p className="mt-2 text-muted">
            {itemCount} {itemCount === 1 ? "Item" : "Items"} · ৳{subtotal.toFixed(2)}
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="Your cart is empty"
            description="Looks like you haven&apos;t added anything to your cart yet."
            actionLabel="Start Shopping"
            actionHref="/products"
            onAction={() => { }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-6">Cart Items</h2>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.cartItemId} className="rounded-2xl border border-default bg-surface-card p-4 shadow-sm hover:shadow-md dark:shadow-none">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                        <img src={item.imageUrl || "https://via.placeholder.com/120x120?text=No+Image"} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-primary">
                          <Link to={`/products/${item.id}`} className="hover:text-primary-hover transition-colors">
                            {item.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-muted">৳{(item.price || 0).toFixed(2)} each</p>
                        {stockWarnings[item.cartItemId] && (
                          <p className="text-xs text-warning mt-1">
                            {stockWarnings[item.cartItemId]}
                          </p>
                        )}
                        {item.stock === 0 && (
                          <p className="text-xs text-danger font-semibold mt-1">Out of stock</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-default bg-surface-card text-primary hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => handleQuantityChange(item.cartItemId, (item.quantity || 1) - 1)}
                            disabled={(item.quantity || 1) <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <label className="sr-only" htmlFor={`qty-${item.cartItemId}`}>Quantity</label>
                          <input
                            id={`qty-${item.cartItemId}`}
                            type="number"
                            min={1}
                            max={item.stock || 999}
                            value={item.quantity || 1}
                            onChange={(e) => handleQuantityChange(item.cartItemId, parseInt(e.target.value || 1, 10))}
                            className="w-14 text-center rounded-lg border border-default bg-surface-card px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            aria-label={`Quantity for ${item.name}`}
                          />
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-default bg-surface-card text-primary hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => handleQuantityChange(item.cartItemId, (item.quantity || 1) + 1)}
                            disabled={(item.quantity || 1) >= (item.stock || 999)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary" aria-label={`Total: ৳${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`}>
                            ৳{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                            onClick={() => handleRemove(item.cartItemId)}
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-card text-primary hover:bg-surface transition-colors"
                            onClick={() => handleSaveForLater(item)}
                            aria-label={`Save ${item.name} for later`}
                          >
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Order Summary</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Subtotal</span>
                    <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-success">
                      <span className="text-sm">Discount ({appliedCoupon.couponCode})</span>
                      <span className="font-semibold">- ৳{appliedCoupon.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Estimated Tax (18%)</span>
                    <span className="font-semibold">৳{tax.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Shipping</span>
                    <span className="font-semibold">{shippingFee === 0 ? "Free" : `৳${shippingFee}`}</span>
                  </div>

                  <div className="border-t border-default pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-secondary">Total</span>
                      <span className="text-2xl font-extrabold text-primary">৳{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-secondary" htmlFor="cart-coupon">Coupon code</label>
                      <div className="flex gap-2 mt-2">
                        <input
                          id="cart-coupon"
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Enter code"
                          disabled={!!appliedCoupon}
                          aria-describedby={couponMessage ? "cart-coupon-message" : undefined}
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                          className="inline-flex items-center justify-center rounded-lg border border-default bg-surface-card px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isApplyingCoupon ? "Applying..." : "Apply"}
                        </button>
                      </div>
                      {couponMessage && (
                        <p
                          id="cart-coupon-message"
                          className={`text-sm mt-2 ${couponStatus === "success" ? "text-success" : "text-danger"}`}
                          role="alert"
                        >
                          {couponMessage}
                        </p>
                      )}
                      {appliedCoupon && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-sm text-muted underline mt-1 hover:text-primary transition-colors"
                        >
                          Remove coupon
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleProceedToCheckout}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed w-full dark:shadow-none"
                      >
                        {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
                      </button>
                      <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary hover:bg-surface transition-colors w-full">
                        Continue Shopping
                      </Link>
                    </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}

        {lastRemovedItem && (
          <div className="fixed bottom-20 right-4 bg-surface-elevated border border-default rounded-lg shadow-xl p-4 flex items-center gap-3 z-50">
            <span className="text-sm text-secondary">Item removed</span>
            <button
              type="button"
              onClick={handleUndoRemove}
              className="text-sm text-primary hover:text-primary-hover font-medium"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>);
};

export default Cart;