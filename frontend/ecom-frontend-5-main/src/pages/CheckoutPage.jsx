import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../Context/AuthContext";
import { useCart } from "../Context/CartContext";
import { useWebSocket } from "../Context/WebSocketContext";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "../stripe";
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
      const list = data?.items || data || [];
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
      const newAddr = data?.data || data;
      setAddresses(prev => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id || newAddr.addressId);
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
      const d = data?.data || data;
      if (d?.valid) {
        setCouponDiscount(d.discountAmount || 0);
        setCouponCode(d.couponCode || couponCode);
        setCouponOk(true);
        setCouponMsg(`Coupon applied: ₹${(d.discountAmount || 0).toFixed(2)} off`);
        toast.success("Coupon applied");
      } else {
        setCouponOk(false);
        setCouponMsg(d?.message || "Invalid coupon");
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
      await confirmOrder(orderResult.orderId);
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
      <div className="page-container" style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4" style={{ width: 64, height: 64, color: "var(--color-success)" }} />
          <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-4">Thank you for your purchase.</p>
        </div>
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Order ID</span>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">#{orderResult.orderId}</code>
              <CopyOrderId id={orderResult.orderId} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Expected delivery</span>
            <span className="font-medium">{estDelivery}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-modern btn-modern-primary flex-1" onClick={() => navigate("/orders")}>
            Track Order
          </button>
          <button className="btn btn-ghost flex-1" onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret: orderResult?.clientSecret,
  };

  return (
    <div className="page-container" style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 20px" }}>
      <h1 className="page-title mb-6">Checkout</h1>

      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
<div className="stepper-circle stepper-done">
               {step > s.num ? <CheckCircle2 size={18} /> : s.num}
             </div>
             <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? "text-gray-900" : "text-gray-400"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? "bg-blue-600" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

{step === 1 && (
         <div>
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin size={20} /> Delivery Address</h2>
           {loadingAddresses ? (
             <div className="text-center py-8"><Loader2 className="animate-spin mx-auto" size={24} /></div>
           ) : addresses.length === 0 && !showAddressForm ? (
             <div className="text-center py-8 text-gray-500">
               <p className="mb-4">No saved addresses. Add one to continue.</p>
               <button className="btn btn-modern btn-modern-primary" onClick={() => setShowAddressForm(true)}>
                 <Plus size={18} className="mr-2" /> Add New Address
               </button>
             </div>
           ) : (
             <div className="grid gap-3 mb-4">
               {addresses.map(a => (
                 <label
                   key={a.id || a.addressId}
                   className={`card cursor-pointer flex items-start gap-4 p-4 ${selectedAddressId === (a.id || a.addressId) ? "ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-900/20" : ""}`}
                 >
                   <input
                     type="radio"
                     name="address"
                     id={`address-${a.id || a.addressId}`}
                     className="mt-1"
                     checked={selectedAddressId === (a.id || a.addressId)}
                     onChange={() => setSelectedAddressId(a.id || a.addressId)}
                   />
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="font-semibold">{a.fullName}</span>
                       <span className="sr-only">({a.label} address)</span>
                       <span className="badge badge-gray text-xs">{a.label}</span>
                       {a.isDefault && <span className="badge badge-green text-xs">Default</span>}
                     </div>
                     <p className="text-sm text-gray-600">{a.line1}{a.line2 && `, ${a.line2}`}</p>
                     <p className="text-sm text-gray-600">{a.city}, {a.state} - {a.pinCode}</p>
                     <p className="text-sm text-gray-500">{a.phone}</p>
                   </div>
                 </label>
               ))}
               <button className="btn btn-ghost text-sm" onClick={() => setShowAddressForm(!showAddressForm)}>
                 <Plus size={16} className="mr-1" /> {showAddressForm ? "Cancel" : "Add New Address"}
               </button>

               {showAddressForm && (
                 <div className="card p-4 grid gap-3 sm:grid-cols-2">
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
                     <div key={f.name} className={["label", "fullName", "phone", "line1", "line2"].includes(f.name) ? "sm:col-span-2" : ""}>
                       <label className="text-sm font-medium text-gray-700" htmlFor={`add-address-${f.name}`}>{f.label}</label>
                       {f.type === "select" ? (
                         <select
                           id={`add-address-${f.name}`}
                           className="input mt-1"
                           value={addressForm[f.name]}
                           onChange={(e) => setAddressForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                         >
                           {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                         </select>
                       ) : (
                         <input
                           id={`add-address-${f.name}`}
                           className="input mt-1"
                           value={addressForm[f.name]}
                           onChange={(e) => setAddressForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                           required={["fullName", "phone", "line1", "city", "state", "pinCode"].includes(f.name)}
                         />
                       )}
                     </div>
                   ))}
                   <label className="flex items-center gap-2 sm:col-span-2">
                     <input
                       type="checkbox"
                       id="add-address-isDefault"
                       checked={addressForm.isDefault}
                       onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                     />
                     <span className="text-sm">Set as default address</span>
                   </label>
                   <div className="sm:col-span-2 flex gap-2">
                     <button
                       type="button"
                       className="btn btn-ghost"
                       onClick={() => {
                         setShowAddressForm(false);
                         setAddressForm({ label: "HOME", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pinCode: "", country: "India", isDefault: false });
                       }}
                     >
                       Cancel
                     </button>
                     <button
                       type="button"
                       className="btn btn-modern btn-modern-primary flex-1"
                       disabled={savingAddress}
                       onClick={handleSaveAddress}
                     >
                       {savingAddress ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                       {savingAddress ? "Saving..." : "Save Address"}
                     </button>
                   </div>
                 </div>
               )}
             </div>
           )}

<div className="flex justify-end">
              <button className="btn btn-modern btn-modern-primary" disabled={!canProceedFromAddress} onClick={() => setStep(2)}>
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Package size={20} /> Review Order</h2>
          <div className="card mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.cartItemId} className="border-b last:border-0">
                    <td className="py-2 flex items-center gap-2">
                      <img src={it.imageUrl || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded object-cover" />
                      <span className="font-medium truncate max-w-[200px]">{it.name}</span>
                    </td>
                    <td className="text-center py-2">{it.quantity}</td>
                    <td className="text-right py-2">₹{(it.price || 0).toFixed(2)}</td>
                    <td className="text-right py-2 font-semibold">₹{((it.price || 0) * (it.quantity || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Tax (18%)</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Shipping</span>
              <span className="font-medium">{shippingFee === 0 ? "Free" : `₹${shippingFee}`}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between mb-2 text-green-700">
                <span className="text-sm">Discount ({couponCode})</span>
                <span className="font-medium">- ₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-bold">Total</span>
              <span className="font-extrabold text-xl text-blue-600">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="card mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2">Shipping Method</label>
            <div className="flex gap-3">
              {["STANDARD", "EXPRESS"].map(method => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shipping"
                    value={method}
                    checked={shippingMethod === method}
                    onChange={() => setShippingMethod(method)}
                  />
                  <span className="text-sm">{method === "STANDARD" ? "Standard" : "Express"}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card mb-4">
            <label className="text-sm font-medium text-gray-700">Coupon code</label>
            <div className="flex gap-2 mt-2">
              <input
                className="input flex-1"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Enter code"
                disabled={couponOk}
              />
              <button className="btn btn-secondary" onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponOk}>Apply</button>
            </div>
            {couponMsg && <p className={`text-sm mt-1 ${couponOk ? "text-green-600" : "text-red-600"}`}>{couponMsg}</p>}
            {couponOk && (
              <button className="text-sm text-gray-500 underline mt-1" onClick={() => { setCouponOk(false); setCouponCode(""); setCouponMsg(""); }}>Remove</button>
            )}
          </div>

          <div className="flex justify-between">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              <ChevronLeft size={18} className="mr-1" /> Back
            </button>
            <button className="btn btn-modern btn-modern-primary" onClick={initiate} disabled={processing}>
              {processing ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Place Order
            </button>
          </div>
        </div>
      )}

      {step === 3 && orderResult && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard size={20} /> Payment</h2>
          <Elements stripe={stripePromise} options={stripeOptions}>
            <CheckoutForm onPaymentSuccess={handlePaymentSuccess} processingMsg={processingMsg} total={total} />
          </Elements>
        </div>
      )}
    </div>
  );
};

function CheckoutForm({ onPaymentSuccess, processingMsg, total }) {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [stripeError, setStripeError] = useState("");
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setStripeError("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    });

    if (error) {
      setStripeError(error.message || "Payment failed");
      toast.error(error.message || "Payment failed");
    } else {
      onPaymentSuccess();
    }
    setPaying(false);
  };

  if (processingMsg) {
    return (
      <div className="card mb-4 p-8 text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
        <p className="text-gray-600">{processingMsg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card mb-4">
        <PaymentElement />
        {stripeError && <p className="text-red-600 text-sm mt-2">{stripeError}</p>}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Total to pay</span>
        <span className="font-extrabold text-xl text-blue-600">₹{total.toFixed(2)}</span>
      </div>

      <div className="flex justify-between">
        <button type="button" className="btn btn-ghost" onClick={() => {}}>
          <ChevronLeft size={18} className="mr-1" /> Back
        </button>
        <button type="submit" className="btn btn-modern btn-modern-primary" disabled={!stripe || paying}>
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
    <button className="icon-button p-1" onClick={copy} title="Copy">
      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
    </button>
  );
}

export default CheckoutPage;