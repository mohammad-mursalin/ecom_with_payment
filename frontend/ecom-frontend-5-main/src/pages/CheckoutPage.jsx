import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../Context/AuthContext";
import { useCart } from "../Context/CartContext";
import { useWebSocket } from "../Context/WebSocketContext";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise, darkAppearance, lightAppearance } from "../stripe";
import { useTheme } from "../hooks/useTheme";
import { getAddresses, createAddress } from "../services/addressService";
import { initiateOrder, confirmOrder, getOrder } from "../services/orderService";
import { validateCoupon } from "../services/couponService";
import { getShippingEstimate } from "../services/shippingService";
import {
  MapPin, ChevronLeft, ChevronRight, CreditCard, CheckCircle2,
  Package, Plus, Loader2, Copy, Check
} from "lucide-react";

const STEPS = [
  { num: 1, label: "Address" },
  { num: 2, label: "Review" },
  { num: 3, label: "Payment" },
  { num: 4, label: "Confirmation" },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { connected: wsConnected, subscribe } = useWebSocket();
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "HOME", fullName: "", phone: "", line1: "", line2: "",
    city: "", state: "", pinCode: "", country: "India", isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [couponOk, setCouponOk] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [shippingFee, setShippingFee] = useState(0);

  const fallbackTimerRef = useRef(null);
  const subscriptionRef = useRef(null);

  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const data = await getAddresses();
      const list = data || [];
      setAddresses(list);
      const def = list.find(a => a.isDefault) || list[0];
      if (def) setSelectedAddressId(def.id || def.addressId);
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || "Failed to load addresses";
      toast.error(msg);
    } finally {
      setLoadingAddresses(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?returnUrl=/checkout");
      return;
    }
    if (items.length === 0 && step < 4) {
      navigate("/cart");
      toast.info("Your cart is empty. Add items before checkout.");
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, items.length, navigate, toast, step, fetchAddresses]);

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const data = await getShippingEstimate({ subtotal, method: shippingMethod });
        setShippingFee(data?.fee ?? 0);
      } catch (err) {
        setShippingFee(0);
      }
    };
    fetchShipping();
  }, [subtotal, shippingMethod]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const data = await createAddress(addressForm);
      setAddresses(prev => [...prev, data]);
      setSelectedAddressId(data.id || data.addressId);
      setShowAddressForm(false);
      setAddressForm({
        label: "HOME", fullName: "", phone: "", line1: "", line2: "",
        city: "", state: "", pinCode: "", country: "India", isDefault: false,
      });
      toast.success("Address saved");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to save address";
      toast.error(msg);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMsg(""); setCouponOk(false);
    try {
      const data = await validateCoupon({ code: couponCode.trim(), orderSubtotal: subtotal });
      if (data?.valid) {
        setCouponDiscount(data.discountAmount || 0);
        setCouponCode(data.couponCode || couponCode);
        setCouponOk(true);
        setCouponMsg(`Coupon applied: ৳${(data.discountAmount || 0).toFixed(2)} off`);
        toast.success("Coupon applied");
      } else {
        setCouponOk(false);
        setCouponMsg(data?.message || "Invalid coupon");
        setCouponDiscount(0);
        setCouponCode("");
      }
    } catch (err) {
      setCouponOk(false);
      setCouponMsg(err.response?.data?.message || err.response?.data?.error || "Invalid coupon code");
      setCouponDiscount(0);
      setCouponCode("");
    }
  };

  const discount = couponOk ? couponDiscount : 0;
  const tax = subtotal * 0.18;
  const total = Math.max(subtotal + tax + shippingFee - discount, 0);

  const canProceedFromAddress = selectedAddressId !== null;

  const initiate = async () => {
    setProcessing(true);
    try {
      const selected = addresses.find(a => (a.id || a.addressId) === selectedAddressId);
      if (!selected) {
        toast.error("Please select or add a delivery address");
        setProcessing(false);
        return;
      }

      const snapshot = {
        fullName: selected.fullName,
        phone: selected.phone,
        line1: selected.line1,
        line2: selected.line2 || "",
        city: selected.city,
        state: selected.state,
        pinCode: selected.pinCode,
        country: selected.country || "India",
      };

      const data = await initiateOrder({
        addressSnapshot: snapshot,
        ...(couponOk && couponCode ? { couponCode } : {}),
        shippingMethod,
      });
      const result = data?.data || data;
      setOrderResult({
        orderId: result?.orderId,
        clientSecret: result?.clientSecret,
      });
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to initiate order";
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setProcessingMsg("Processing your order...");

    try {
      const paymentIntentId = orderResult?.clientSecret?.split("_secret_")[0];
      await confirmOrder(orderResult.orderId, paymentIntentId);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to confirm order");
      setProcessingMsg(null);
      return;
    }

    const handleWsMessage = (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.orderId === orderResult.orderId && data.status === "CONFIRMED") {
          if (subscriptionRef.current) subscriptionRef.current();
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          clearCart();
          setProcessingMsg(null);
          setStep(4);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn("WS parse error", e);
      }
    };

    if (wsConnected && subscribe) {
      subscriptionRef.current = subscribe("/user/queue/orders", handleWsMessage);
    }

    fallbackTimerRef.current = setTimeout(async () => {
      if (subscriptionRef.current) subscriptionRef.current();
      setProcessingMsg(null);
      try {
        const order = await getOrder(orderResult.orderId);
        const orderData = order?.data || order;
        if (orderData?.status === "CONFIRMED") {
          clearCart();
          setStep(4);
        } else {
          toast.info("Your order is being processed. Check your orders page shortly.");
          navigate("/orders");
        }
      } catch {
        navigate("/orders");
      }
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (subscriptionRef.current) subscriptionRef.current();
    };
  }, []);

  if (step === 4 && orderResult) {
    const estDelivery = new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle2 className="mx-auto mb-4 text-success" size={64} />
          <h2 className="text-2xl font-bold text-primary mb-2">Order Placed Successfully!</h2>
          <p className="text-secondary mb-4">Thank you for your purchase.</p>
          <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-secondary">Order ID</span>
              <div className="flex items-center gap-2">
                <code className="bg-surface px-3 py-1 rounded-lg text-sm font-mono text-primary">#{orderResult.orderId}</code>
                <CopyOrderId id={orderResult.orderId} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Expected delivery</span>
              <span className="font-medium text-primary">{estDelivery}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none" onClick={() => navigate("/orders")}>
              Track Order
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated" onClick={() => navigate("/products")}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret: orderResult?.clientSecret,
    appearance: theme === 'dark' ? darkAppearance : lightAppearance,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-6">Checkout</h1>

      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s.num ? "bg-primary text-white" : "bg-surface-elevated text-muted border border-default"}`}>
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? "text-primary" : "text-muted"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? "bg-primary" : "bg-default"}`} />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-6">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-primary" /> Delivery Address
              </h2>
              {loadingAddresses ? (
                <div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></div>
              ) : addresses.length === 0 && !showAddressForm ? (
                <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none text-center">
                  <p className="text-secondary mb-4">No saved addresses. Add one to continue.</p>
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none" onClick={() => setShowAddressForm(true)}>
                    <Plus size={18} /> Add New Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {addresses.map(a => (
                    <label
                      key={a.id || a.addressId}
                      className={`rounded-2xl border border-default bg-surface-card p-4 cursor-pointer flex items-start gap-4 transition-colors ${selectedAddressId === (a.id || a.addressId) ? "border-2 border-primary bg-primary/5" : "hover:border-primary/50"}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        id={`address-${a.id || a.addressId}`}
                        className="mt-1 accent-primary"
                        checked={selectedAddressId === (a.id || a.addressId)}
                        onChange={() => setSelectedAddressId(a.id || a.addressId)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary">{a.fullName}</span>
                          <span className="sr-only">({a.label} address)</span>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-surface-elevated text-muted">{a.label}</span>
                          {a.isDefault && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-success/10 text-success">Default</span>}
                        </div>
                        <p className="text-sm text-secondary">{a.line1}{a.line2 && `, ${a.line2}`}</p>
                        <p className="text-sm text-secondary">{a.city}, {a.state} - {a.pinCode}</p>
                        <p className="text-sm text-muted">{a.phone}</p>
                      </div>
                    </label>
                  ))}
                  <button className="text-primary hover:text-primary-hover font-medium" onClick={() => setShowAddressForm(!showAddressForm)}>
                    <Plus size={16} className="mr-1" /> {showAddressForm ? "Cancel" : "Add New Address"}
                  </button>

                  {showAddressForm && (
                    <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
                      <form onSubmit={handleSaveAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: "label", label: "Label", type: "select", options: ["HOME", "WORK", "OTHER"] },
                          { name: "fullName", label: "Full Name" },
                          { name: "phone", label: "Phone" },
                          { name: "line1", label: "Address Line 1" },
                          { name: "line2", label: "Address Line 2" },
                          { name: "city", label: "City" },
                          { name: "state", label: "State" },
                          { name: "pinCode", label: "PIN Code" },
                        ].map(f => (
                          <div key={f.name} className={["label", "fullName", "phone", "line1", "line2"].includes(f.name) ? "md:col-span-2" : ""}>
                            <label htmlFor={`add-address-${f.name}`} className="block text-sm font-medium text-secondary mb-1">{f.label}</label>
                            {f.type === "select" ? (
                              <select
                                id={`add-address-${f.name}`}
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm[f.name]}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                              >
                                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input
                                id={`add-address-${f.name}`}
                                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={addressForm[f.name]}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                                required={["fullName", "phone", "line1", "city", "state", "pinCode"].includes(f.name)}
                              />
                            )}
                          </div>
                        ))}
                        <label className="flex items-center gap-2 md:col-span-2">
                          <input
                            type="checkbox"
                            id="add-address-isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                          />
                          <span className="text-sm text-primary">Set as default address</span>
                        </label>
                        <div className="md:col-span-2 flex gap-2">
                          <button
                            type="button"
                            className="text-primary hover:text-primary-hover font-medium"
                            onClick={() => {
                              setShowAddressForm(false);
                              setAddressForm({ label: "HOME", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pinCode: "", country: "India", isDefault: false });
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none flex-1"
                            disabled={savingAddress}
                            onClick={handleSaveAddress}
                          >
                            {savingAddress ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                            {savingAddress ? "Saving..." : "Save Address"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                <Package size={20} className="text-primary" /> Review Order
              </h2>
              <div className="rounded-2xl border border-default bg-surface-card shadow-sm dark:shadow-none overflow-x-auto mb-4">
                <div className="p-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-default">
                        <th className="text-left py-2 text-sm font-medium text-secondary">Item</th>
                        <th className="text-center py-2 text-sm font-medium text-secondary">Qty</th>
                        <th className="text-right py-2 text-sm font-medium text-secondary">Price</th>
                        <th className="text-right py-2 text-sm font-medium text-secondary">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(it => (
                        <tr key={it.cartItemId} className="border-b border-default last:border-0">
                          <td className="py-2 flex items-center gap-2">
                            <img src={it.imageUrl || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-lg object-cover bg-surface" />
                            <span className="font-medium text-primary truncate max-w-[200px]">{it.name}</span>
                          </td>
                          <td className="text-center py-2 text-secondary">{it.quantity}</td>
                          <td className="text-right py-2 text-secondary">৳{(it.price || 0).toFixed(2)}</td>
                          <td className="text-right py-2 font-semibold text-primary">৳{((it.price || 0) * (it.quantity || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Subtotal</span>
                  <span className="font-medium text-primary">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Tax (18%)</span>
                  <span className="font-medium text-primary">৳{tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Shipping</span>
                  <span className="font-medium text-primary">{shippingFee === 0 ? "Free" : `৳${shippingFee}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-success">
                    <span className="text-secondary">Discount ({couponCode})</span>
                    <span className="font-medium">- ৳{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-default pt-3">
                  <span className="font-bold text-primary">Total</span>
                  <span className="font-extrabold text-xl text-primary">৳{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">Shipping Method</label>
                <div className="flex gap-3">
                  {["STANDARD", "EXPRESS"].map(method => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="shipping"
                        value={method}
                        checked={shippingMethod === method}
                        onChange={() => setShippingMethod(method)}
                        className="accent-primary"
                      />
                      <span className="text-sm text-primary">{method === "STANDARD" ? "Standard" : "Express"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">Coupon code</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    disabled={couponOk}
                  />
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated" onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponOk}>Apply</button>
                </div>
                {couponMsg && <p className={`text-sm mt-1 ${couponOk ? "text-success" : "text-danger"}`}>{couponMsg}</p>}
                {couponOk && (
                  <button className="text-sm text-muted underline mt-1" onClick={() => { setCouponOk(false); setCouponCode(""); setCouponMsg(""); }}>Remove</button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button className="text-primary hover:text-primary-hover font-medium" onClick={() => setStep(1)}>
                  <ChevronLeft size={18} className="mr-1" /> Back
                </button>
              </div>
            </div>
          )}

          {step === 3 && orderResult && (
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-primary" /> Payment
              </h2>
              <Elements stripe={stripePromise} options={stripeOptions}>
                <CheckoutForm onPaymentSuccess={handlePaymentSuccess} processingMsg={processingMsg} total={total} />
              </Elements>
            </div>
          )}
        </div>

        <div className="lg:w-1/3">
          <div className="lg:sticky lg:top-4 rounded-2xl border border-default bg-surface-card shadow-sm dark:shadow-none p-6 space-y-5">
            <h3 className="text-lg font-semibold text-primary">Order Summary</h3>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.cartItemId} className="flex items-start gap-3">
                  <img src={item.imageUrl || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-lg object-cover bg-surface" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{item.name}</p>
                    <p className="text-sm text-muted">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">৳{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-default pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Subtotal</span>
                <span className="font-medium text-primary">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Tax (18%)</span>
                <span className="font-medium text-primary">৳{tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Shipping</span>
                <span className="font-medium text-primary">{shippingFee === 0 ? "Free" : `৳${shippingFee}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Discount ({couponCode})</span>
                  <span className="font-medium text-success">- ৳{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-default pt-3">
                <span className="font-bold text-primary">Total</span>
                <span className="font-extrabold text-xl text-primary">৳{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Shipping Method</label>
              <div className="flex gap-3">
                {["STANDARD", "EXPRESS"].map(method => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shipping"
                      value={method}
                      checked={shippingMethod === method}
                      onChange={() => setShippingMethod(method)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-primary">{method === "STANDARD" ? "Standard" : "Express"}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Coupon code</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Enter code"
                  disabled={couponOk}
                />
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated" onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponOk}>Apply</button>
              </div>
              {couponMsg && <p className={`text-sm mt-1 ${couponOk ? "text-success" : "text-danger"}`}>{couponMsg}</p>}
              {couponOk && (
                <button className="text-sm text-muted underline mt-1" onClick={() => { setCouponOk(false); setCouponCode(""); setCouponMsg(""); }}>Remove</button>
              )}
            </div>

            <div className="pt-2">
              {step === 1 && (
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                  disabled={!canProceedFromAddress}
                  onClick={() => setStep(2)}
                >
                  Continue to Review <ChevronRight size={18} />
                </button>
              )}
              {step === 2 && (
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                  disabled={processing}
                  onClick={initiate}
                >
                  {processing ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Place Order
                </button>
              )}
              {step === 3 && (
                <div className="text-center">
                  <span className="text-sm text-muted">Complete payment in the form</span>
                  <p className="font-extrabold text-xl text-primary">৳{total.toFixed(2)}</p>
                  <p className="text-sm text-muted">Total to pay</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function CheckoutForm({ onPaymentSuccess, processingMsg, total }) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const stripe = useStripe();
  const elements = useElements();
  const [stripeError, setStripeError] = useState("");
  const [paying, setPaying] = useState(false);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    if (!elements) return;
    elements.update({ appearance: themeRef.current === 'dark' ? darkAppearance : lightAppearance });
  }, [elements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setStripeError("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setStripeError(error.message || "Payment failed");
      toast.error(error.message || "Payment failed");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onPaymentSuccess();
    } else {
      setStripeError("Payment could not be confirmed. Please try again.");
    }
    setPaying(false);
  };

  if (processingMsg) {
    return (
      <div className="rounded-2xl border border-default bg-surface-card p-8 shadow-sm dark:shadow-none text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
        <p className="text-secondary">{processingMsg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none mb-4">
        <PaymentElement />
        {stripeError && <p className="text-danger text-sm mt-2">{stripeError}</p>}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-secondary">Total to pay</span>
        <span className="font-extrabold text-xl text-primary">৳{total.toFixed(2)}</span>
      </div>

      <div className="flex justify-between">
        <button type="button" className="text-primary hover:text-primary-hover font-medium" onClick={() => {}}>
          <ChevronLeft size={18} className="mr-1" /> Back
        </button>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none" disabled={!stripe || paying}>
          {paying ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          {paying ? "Processing..." : "Pay"}
        </button>
      </div>
    </form>
  );
}

function CopyOrderId({ id }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id?.toString() || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="p-1 hover:bg-surface-elevated rounded-md transition-colors" onClick={copy} title="Copy">
      {copied ? <Check size={16} className="text-success" /> : <Copy size={16} className="text-secondary" />}
    </button>
  );
}

export default CheckoutPage;
