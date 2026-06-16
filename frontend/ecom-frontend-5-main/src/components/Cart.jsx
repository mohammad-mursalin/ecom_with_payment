import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../Context/AuthContext";
import { useCart } from "../Context/CartContext";
import { useWishlist } from "../Context/WishlistContext";
import { validateCoupon } from "../services/couponService";
import { getShippingEstimate } from "../services/shippingService";
import { ShoppingBasket, Plus, Minus, CreditCard, ChevronRight, Heart } from "lucide-react";
import ProductCardSkeleton from "./ProductCardSkeleton";

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
        updateItem(item.cartItemId, item.stock).catch(() => {});
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
        setCouponMessage(`Coupon applied: ₹${result.discountAmount.toFixed(2)} off`);
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
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Shopping Cart</h1>
            <p className="page-subtitle">Loading your cart...</p>
          </div>
        </div>
        <div className="grid-container">
          <div className="cart-items-wrapper">
            <div className="cart-items">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="cart-item">
                  <div className="cart-item-image">
                    <ProductCardSkeleton />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-summary">
            <div className="space-y-4">
              <div className="h-6 w-32 rounded" style={{ backgroundColor: "var(--border-color)" }}></div>
              <div className="h-4 w-40 rounded" style={{ backgroundColor: "var(--border-color)" }}></div>
              <div className="h-4 w-36 rounded" style={{ backgroundColor: "var(--border-color)" }}></div>
              <div className="h-4 w-28 rounded" style={{ backgroundColor: "var(--border-color)" }}></div>
              <div className="h-10 w-full rounded" style={{ backgroundColor: "var(--border-color)" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">
            {itemCount} {itemCount === 1 ? "Item" : "Items"} · ₹{subtotal.toFixed(2)}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <ShoppingBasket className="empty-state-icon text-blue-600" />
          <h2 className="empty-state-title">Your cart is empty</h2>
          <p className="empty-state-description">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link to="/products" className="btn btn-modern btn-modern-primary">
            Start Shopping
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      ) : (
        <div className="grid-container">
          <div className="cart-items-wrapper">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold">Cart Items</h2>
            </div>

            <div className="cart-items">
              {items.map((item) => (
                <div key={item.cartItemId} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.imageUrl || "https://via.placeholder.com/120x120?text=No+Image"} alt={item.name} />
                  </div>
                  <div className="cart-item-info">
                    <h3 className="cart-item-title">
                      <Link to={`/products/${item.id}`}>{item.name}</Link>
                    </h3>
                    <p className="text-sm text-gray-500">₹{(item.price || 0).toFixed(2)} each</p>
                    {stockWarnings[item.cartItemId] && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        {stockWarnings[item.cartItemId]}
                      </p>
                    )}
                    {item.stock === 0 && (
                      <p className="text-xs text-red-600 font-semibold mt-1">Out of stock</p>
                    )}
                  </div>
<div className="cart-item-actions">
                       <div className="flex items-center gap-1">
                         <button
                           type="button"
                           className="counter-btn"
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
                           className="w-14 text-center border rounded-md py-1 text-sm"
                           aria-label={`Quantity for ${item.name}`}
                         />
                         <button
                           type="button"
                           className="counter-btn"
                           onClick={() => handleQuantityChange(item.cartItemId, (item.quantity || 1) + 1)}
                           disabled={(item.quantity || 1) >= (item.stock || 999)}
                           aria-label="Increase quantity"
                         >
                           <Plus className="w-4 h-4" />
                         </button>
                       </div>

                       <div className="flex items-center gap-2 mt-2">
                         <span className="text-lg font-bold text-blue-600" aria-label={`Total: ₹${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`}>
                           ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                         </span>
                         <button
                           type="button"
                           className="icon-button bg-red-100 text-red-600 hover:bg-red-200"
                           onClick={() => handleRemove(item.cartItemId)}
                           aria-label={`Remove ${item.name} from cart`}
                         >
                           <Minus className="w-5 h-5" />
                         </button>
                         <button
                           type="button"
                           className="icon-button bg-gray-100 text-gray-700 hover:bg-gray-200"
                           onClick={() => handleSaveForLater(item)}
                           aria-label={`Save ${item.name} for later`}
                         >
                           <Heart className="w-5 h-5" />
                         </button>
                       </div>
                     </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="order-summary">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">Order Summary</h2>
              </div>

              <div className="order-summary-item">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="order-summary-item text-green-700 dark:text-green-400">
                  <span>Discount ({appliedCoupon.couponCode})</span>
                  <span className="font-semibold">- ₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="order-summary-item">
                <span>Estimated Tax (18%)</span>
                <span className="font-semibold">₹{tax.toFixed(2)}</span>
              </div>

              <div className="order-summary-item">
                <span>Shipping</span>
                <span className="font-semibold">{shippingFee === 0 ? "Free" : `₹${shippingFee}`}</span>
              </div>

              <div className="order-summary-total">
                <span>Total</span>
                <span className="font-extrabold text-2xl text-blue-600">₹{grandTotal.toFixed(2)}</span>
              </div>

<div className="mt-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="cart-coupon">Coupon code</label>
                <div className="flex gap-2 mt-2">
                  <input
                    id="cart-coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    placeholder="Enter code"
                    disabled={!!appliedCoupon}
                    aria-describedby={couponMessage ? "cart-coupon-message" : undefined}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="btn btn-secondary px-4"
                  >
                    {isApplyingCoupon ? "Applying..." : "Apply"}
                  </button>
                </div>
                {couponMessage && (
                  <p
                    id="cart-coupon-message"
                    className={`text-sm mt-2 ${
                      couponStatus === "success" ? "text-green-600" : "text-red-600"
                    }`}
                    role="alert"
                  >
                    {couponMessage}
                  </p>
                )}
                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-sm text-gray-500 underline mt-1"
                  >
                    Remove coupon
                  </button>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="btn btn-modern btn-modern-primary w-full"
                >
                  {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
                </button>
                <Link to="/products" className="btn btn-ghost w-full mt-3 text-center">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {lastRemovedItem && (
        <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex items-center gap-3 z-50">
          <span className="text-sm text-gray-700 dark:text-gray-300">Item removed</span>
          <button
            type="button"
            onClick={handleUndoRemove}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;