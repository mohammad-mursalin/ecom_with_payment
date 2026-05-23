import React from "react";
import { Modal, Button, Form } from "react-bootstrap";

const CheckoutPopup = ({
  show,
  handleClose,
  cartItems,
  totalPrice,
  handleCheckout,
  isProcessing,
  shippingForm,
  setShippingForm,
  shippingMethod,
  setShippingMethod,
  shippingCost,
  grandTotal,
  validateShipping,
}) => {
  const handleInputChange = (e) => {
    setShippingForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="checkoutPopup">
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Checkout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* --- Shipping Form --- */}
          <div className="mb-4">
            <h5
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "1rem",
              }}
            >
              Shipping Information
            </h5>

            <Form>
              <div className="row mb-3">
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Address *</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      placeholder="Street address"
                      value={shippingForm.address}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Area *</Form.Label>
                    <Form.Control
                      type="text"
                      name="area"
                      placeholder="Neighbourhood / Area"
                      value={shippingForm.area}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>City *</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      placeholder="City"
                      value={shippingForm.city}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Country</Form.Label>
                    <Form.Control type="text" value="Bangladesh" disabled />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Shipping Method *</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    name="shippingMethod"
                    id="shipStandard"
                    label="Standard"
                    value="STANDARD"
                    checked={shippingMethod === "STANDARD"}
                    onChange={() => setShippingMethod("STANDARD")}
                    disabled={isProcessing}
                  />
                  <Form.Check
                    type="radio"
                    name="shippingMethod"
                    id="shipExpress"
                    label="Express"
                    value="EXPRESS"
                    checked={shippingMethod === "EXPRESS"}
                    onChange={() => setShippingMethod("EXPRESS")}
                    disabled={isProcessing}
                  />
                </div>
              </Form.Group>
            </Form>
          </div>

          <hr />

          {/* --- Order Items Summary --- */}
          <div className="checkout-items">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="checkout-item"
                style={{ display: "flex", marginBottom: "10px" }}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="cart-item-image"
                    style={{ width: "150px", marginRight: "10px" }}
                  />
                )}
                <div>
                  <b>
                    <p>{item.name}</p>
                  </b>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: ${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}

            <div>
              <p style={{ fontSize: "0.95rem" }}>
                Subtotal: <strong>${totalPrice.toFixed(2)}</strong>
              </p>
              <p style={{ fontSize: "0.95rem" }}>
                Shipping (
                <span style={{ textTransform: "capitalize" }}>
                  {shippingMethod.toLowerCase()}
                </span>
                ): <strong>${shippingCost.toFixed(2)}</strong>
              </p>
              <h5
                style={{
                  color: "black",
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                }}
              >
                Total: ${isNaN(grandTotal) ? "0.00" : grandTotal.toFixed(2)}
              </h5>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={validateShipping}
            disabled={isProcessing || !shippingForm.address || !shippingForm.area || !shippingForm.city}
          >
            {isProcessing ? "Processing..." : "Proceed to Payment"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CheckoutPopup;
