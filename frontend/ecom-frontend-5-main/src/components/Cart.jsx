import React, { useContext, useState, useEffect } from "react";
import AppContext from "../Context/Context";
import axios from "../axios";
import CheckoutPopup from "./CheckoutPopup";
import { Button } from "react-bootstrap";
import { useToast } from "./Toast";
import { useAuth } from "../Context/AuthContext";

const Cart = () => {
  const { cart, removeFromCart, clearCart, data: allProducts } = useContext(AppContext);
  const { showToast } = useToast();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Shipping state (all in one place)
  const [shippingForm, setShippingForm] = useState({
    address: "",
    area: "",
    city: "",
  });
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [shippingCost, setShippingCost] = useState(0);
  const grandTotal = totalPrice + shippingCost;

  // Recalculate shipping cost from backend whenever total or method changes
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
      // Build the combined shipping address string: "address, area, city"
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
    <div className="container" style={{ marginTop: "80px", marginBottom: "40px" }}>
      <div className="row">
        {(!cartItems || cartItems.length === 0) && (!cart || cart.length === 0) ? (
          <div className="col-md-12 text-center py-5">
            <div className="mb-3">
              <i className="bi bi-basket" style={{ fontSize: "3rem", color: "#6c757d" }}></i>
            </div>
            <h4>Your cart is empty</h4>
            <p className="text-muted">Add some products to get started</p>
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="col-lg-8">
              <h2 className="mb-4">Shopping Cart</h2>
              <div className="border rounded p-3" style={{ backgroundColor: "var(--card-bg-clr)", borderRadius: "12px" }}>
                {(cartItems.length > 0 ? cartItems : cart).map((item) => (
                  <div
                    key={item.id}
                    className="d-flex align-items-center border-bottom py-3 mb-3"
                    style={{ borderBottom: "1px solid #e9ecef", paddingBottom: "12px", marginBottom: "12px" }}
                  >
                    <div className="me-3" style={{ width: "80px", height: "80px", flexShrink: "0" }}>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "8px"
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-grow-1 me-3">
                      <h6 className="mb-1 fw-semibold">{item.name}</h6>
                      <small className="text-muted">{item.brand}</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleDecreaseQuantity(item.id)}
                        style={{ width: "30px", height: "30px" }}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <span className="mx-3" style={{ minWidth: "40px", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleIncreaseQuantity(item.id)}
                        style={{ width: "30px", height: "30px" }}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                    <div className="text-end ms-3" style={{ minWidth: "100px" }}>
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-currency-rupee"></i>
                        {(item.price * item.quantity).toFixed(2)}
                      </h6>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger ms-3"
                      onClick={() => handleRemoveFromCart(item.id)}
                      title="Remove item"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="card p-4" style={{ backgroundColor: "var(--card-bg-clr)", borderRadius: "12px" }}>
                <h4 className="mb-4">Order Summary</h4>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span className="fw-semibold">
                      <i className="bi bi-currency-rupee"></i>
                      {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping ({shippingMethod.toLowerCase()})</span>
                    <span className="fw-semibold">
                      <i className="bi bi-currency-rupee"></i>
                      {shippingCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-top pt-3 mt-2">
                    <div className="d-flex justify-content-between mb-3">
                      <span className="fw-bold">Grand Total</span>
                      <span className="fw-bold" style={{ fontSize: "1.2rem" }}>
                        <i className="bi bi-currency-rupee"></i>
                        {grandTotal.toFixed(2)}
                      </span>
                    </div>
                    <Button
                      className="btn btn-primary w-100"
                      onClick={() => setShowModal(true)}
                      disabled={isProcessing}
                      style={{ padding: "12px" }}
                    >
                      {isProcessing ? (
                        <span>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing...
                        </span>
                      ) : (
                        "Proceed to Checkout"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

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
