import { useCart } from "../Context/CartContext";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCallback, useState, useEffect, useRef } from "react";
import { useToast } from "./Toast";

export function ChatSuggestedActions({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2.5">
      {actions.map((action) => (
        <ActionButton key={action.label + action.actionType} action={action} />
      ))}
    </div>
  );
}

function ActionButton({ action }) {
  const { label, actionType, payload } = action;
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    switch (actionType) {
      case "ADD_TO_CART": {
        if (!isAuthenticated) {
          toast.info("Please login to add items to your cart");
          navigate("/login");
          return;
        }
        try {
          await addItem(payload.productId, 1);
          setAdded(true);
          timerRef.current = setTimeout(() => setAdded(false), 2000);
        } catch {
          return;
        }
        break;
      }
      case "VIEW_PRODUCT":
        navigate(`/products/${payload.productId}`);
        break;
      case "GO_TO_CHECKOUT":
        navigate("/checkout");
        break;
      case "GO_TO_CART":
        navigate("/cart");
        break;
      case "VIEW_ORDER":
        navigate(`/orders/${payload.orderId}`);
        break;
      default:
        break;
    }
  }, [actionType, payload, addItem, navigate, isAuthenticated, toast]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-default bg-surface-card text-text-primary hover:bg-surface hover:border-text-muted transition-colors"
    >
      {added ? "Added ✓" : label}
    </button>
  );
}
