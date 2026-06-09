import React, { useContext, useState, useEffect } from "react";
import AppContext from "../Context/Context";
import axios from "../axios";
import CheckoutPopup from "./CheckoutPopup";
import { useToast } from "./Toast";
import { useAuth } from "../Context/AuthContext";
import { ShoppingBasket, Trash2, Plus, Minus, CreditCard, MapPin, Truck, CheckCircle2, Package, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Cart = () => {
  const { cart, removeFromCart, clearCart, data: allProducts } = useContext(AppContext);
  const { showToast } = useToast();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    address: "",
    area: "",
    city: "",
  });
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [shippingCost, setShippingCost] = useState(0);
  const grandTotal = totalPrice + shippingCost;

  useEffect(() => {
    if (totalPrice === 0) {
      setShippingCost(0);
      return;
    }
    const controller = new AbortController();
    axios
      .get("/shipping/estimate", {
        params: {
          subtotal: totalPrice.toFixed(2),
          method: shippingMethod,
        },
        signal: controller.signal,
      })
      .then((res) => {
        const cost = res.data?.data ?? 0;
        setShippingCost(cost);
      })
      .catch((err) => {
        if (err.code !== "ERR_CANCELED") {
          console.error("Shipping estimate failed:", err);
          showToast("Could not fetch shipping cost — using $0");
          setShippingCost(0);
        }
      });
    return () => controller.abort();
  }, [totalPrice, shippingMethod]);

  useEffect(() => {
    if (!allProducts || allProducts.length === 0) {
      setCartItems(cart || []);
      return;
    }

    const backendProductMap = new Map(allProducts.map((p) => [p.id, p]));
    const updatedCartItems = cart.filter((item) => backendProductMap.has(item.id));
    const cartItemsWithLatestData = updatedCartItems.map((item) => {
      const backendProduct = backendProductMap.get(item.id);
      return { ...item, ...backendProduct, quantity: item.quantity };
    });
    setCartItems(cartItemsWithLatestData);
  }, [cart, allProducts]);

  useEffect(() => {
    const items = cartItems.length > 0 ? cartItems : cart || [];
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotalPrice(total);
  }, [cartItems, cart]);

  const handleIncreaseQuantity = (itemId) => {
    const newCartItems = cartItems.map((item) => {
      if (item.id === itemId) {
        if (item.quantity < item.stockQuantity) {
          return { ...item, quantity: item.quantity + 1 };
        } else {
          showToast("Cannot add more than available stock");
        }
      }
      return item;
    });
    setCartItems(newCartItems);
  };

  const handleDecreaseQuantity = (itemId) => {
    const newCartItems = cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: Math.max(item.quantity - 1, 1) } : item
    );
    setCartItems(newCartItems);
  };

  const handleRemoveFromCart = (itemId) => {
    removeFromCart(itemId);
    const newCartItems = cartItems.filter((item) => item.id !== itemId);
    setCartItems(newCartItems);
  };

  const validateShipping = () => {
    if (!shippingForm.address.trim() || !shippingForm.area.trim() || !shippingForm.city.trim()) {
      showToast("Please fill in all shipping fields");
      return;
    }
    handleCheckout();
  };

  const handleCheckout = async () => {
    const itemsToCheck = cartItems.length > 0 ? cartItems : cart || [];
    if (itemsToCheck.length === 0) {
      showToast("Your cart is empty");
      return;
    }

    if (!shippingForm.address.trim() || !shippingForm.area.trim() || !shippingForm.city.trim()) {
      showToast("Please fill in all shipping fields");
      return;
    }

    setIsProcessing(true);
    try {
      const shippingAddress = `${shippingForm.address}, ${shippingForm.area}, ${shippingForm.city}`;

      const orderItems = itemsToCheck.map((item) => ({
        productId: item.id,
        productName: item.name,
        productBrand: item.brand,
        productImageUrl: item.imageUrl,
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
      }));

      const response = await axios.post("/payment/create-checkout-session", {
        items: orderItems,
        customerEmail: user?.email || "",
        shippingAddress,
        shippingCost,
        shippingMethod,
      });

      if (response.data.checkoutUrl) {
        clearCart();
        window.location.href = response.data.checkoutUrl;
      } else {
        showToast("Error creating checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      showToast("Error during checkout: " + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="page-header">
          <div>
            <h1 className="page-title">Shopping Cart</h1>
            <p className="page-subtitle">Review your items before checkout</p>
          </div>
          {cartItems.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="btn btn-modern btn-modern-primary"
            >
              <Sparkles className="w-5 h-5" />
              Checkout Now
            </motion.button>
          )}
        </div>

        {(cartItems.length === 0 && (!cart || cart.length === 0)) ? (
          <div className="empty-state">
            <ShoppingBasket className="empty-state-icon text-blue-600" />
            <h2 className="empty-state-title">Your cart is empty</h2>
            <p className="empty-state-description">Add some products to get started. Browse our collection and find something you love.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              as={Link}
              to="/"
              className="btn btn-modern btn-modern-primary"
            >
              Start Shopping
              <ChevronRight className="w-5 h-5 ml-2" />
            </motion.button>
          </div>
        ) : (
          <>
            <div className="grid-container">
              <div>
                <div className="shopping-cart">
                  <div className="flex items-center gap-3 mb-6">
                    <Package className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'} in your cart</h2>
                  </div>

                  <div className="cart-items">
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="cart-item"
                      >
                        <div className="cart-item-image">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                          />
                        </div>
                        <div className="cart-item-info">
                          <h3 className="cart-item-title">{item.name}</h3>
                          <p className="cart-item-brand">{item.brand}</p>
                        </div>
                        <div className="cart-item-actions">
                          <div className="flex items-center gap-2">
                            <button
                              className="counter-btn"
                              onClick={() => handleDecreaseQuantity(item.id)}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-bold">{item.quantity}</span>
                            <button
                              className="counter-btn"
                              onClick={() => handleIncreaseQuantity(item.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <button
                            className="icon-button bg-red-100 text-red-600 hover:bg-red-200"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {cartItems.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowModal(true)}
                      className="btn btn-modern btn-modern-primary w-full mt-6"
                    >
                      <Sparkles className="w-5 h-5" />
                      Proceed to Checkout
                    </motion.button>
                  )}
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
                    <span className="font-bold text-blue-600">₹{totalPrice.toFixed(2)}</span>
                  </div>

                  <div className="order-summary-item">
                    <span>Shipping ({shippingMethod.toLowerCase()})</span>
                    <span className="font-bold text-blue-600">
                      {shippingCost === 0 ? 'Free' : '₹' + shippingCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="order-summary-item">
                    <span>Tax (18%)</span>
                    <span className="font-bold">
                      ₹{(totalPrice * 0.18).toFixed(2)}
                    </span>
                  </div>

                  <div className="order-summary-total">
                    <span className="text-gray-500 dark:text-gray-400">Grand Total</span>
                    <span className="font-bold text-blue-600 text-2xl">
                      ₹{(grandTotal * 1.18).toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-6 p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: 'var(--muted)' }}>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Free Delivery</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">On orders above ₹500</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: 'var(--muted)' }}>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Secure Payment</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">100% secure checkout</p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(true)}
                    disabled={isProcessing}
                    className="btn btn-modern btn-modern-primary w-full mt-6"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <div className="spinner spinner-sm"></div>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Proceed to Checkout
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <CheckoutPopup
        show={showModal}
        handleClose={() => setShowModal(false)}
        cartItems={cartItems}
        totalPrice={totalPrice}
        handleCheckout={handleCheckout}
        isProcessing={isProcessing}
        shippingForm={shippingForm}
        setShippingForm={setShippingForm}
        shippingMethod={shippingMethod}
        setShippingMethod={setShippingMethod}
        shippingCost={shippingCost}
        grandTotal={grandTotal}
        validateShipping={validateShipping}
      />
    </div>
  );
};

export default Cart;