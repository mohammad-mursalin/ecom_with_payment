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
    <div className="cart-container">
      <div className="shopping-cart">
        <div className="title">Shopping Bag</div>
        {(!cartItems || cartItems.length === 0) && (!cart || cart.length === 0) ? (
          <div className="empty" style={{ textAlign: "left", padding: "2rem" }}>
            <h4>Your cart is empty</h4>
          </div>
        ) : (
          <>
            {(cartItems.length > 0 ? cartItems : cart).map((item) => (
              <li key={item.id} className="cart-item">
                <div className="item" style={{ display: "flex", alignContent: "center" }} key={item.id}>
                  <div>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                    )}
                  </div>
                  <div className="description">
                    <span>{item.brand}</span>
                    <span>{item.name}</span>
                  </div>

                  <div className="quantity">
                    <button type="button" name="button" onClick={() => handleIncreaseQuantity(item.id)}>
                      <i className="bi bi-plus-square-fill"></i>
                    </button>
                    <input type="button" name="name" value={item.quantity} readOnly />
                    <button type="button" name="button" onClick={() => handleDecreaseQuantity(item.id)}>
                      <i className="bi bi-dash-square-fill"></i>
                    </button>
                  </div>

                  <div className="total-price " style={{ textAlign: "center" }}>
                    ${item.price * item.quantity}
                  </div>
                  <button className="remove-btn" onClick={() => handleRemoveFromCart(item.id)}>
                    <i className="bi bi-trash3-fill"></i>
                  </button>
                </div>
              </li>
            ))}
            <p style={{ fontSize: "0.95rem", textAlign: "right", padding: "0 10px" }}>
              Subtotal: <strong>${totalPrice.toFixed(2)}</strong>
            </p>
            <p style={{ fontSize: "0.95rem", textAlign: "right", padding: "0 10px" }}>
              Shipping (
              <span style={{ textTransform: "capitalize" }}>{shippingMethod.toLowerCase()}</span>
              ): <strong>${shippingCost.toFixed(2)}</strong>
            </p>
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                textAlign: "right",
                padding: "0 10px",
              }}
            >
              Grand Total: <strong>${grandTotal.toFixed(2)}</strong>
            </p>
            <Button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => setShowModal(true)}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Checkout"}
            </Button>
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
