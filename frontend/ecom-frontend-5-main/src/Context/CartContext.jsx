import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getCart, addItem as addItemService, updateItem as updateItemService, removeItem as removeItemService, syncCart as syncCartService } from "../services/cartService";

const CartContext = createContext(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const normalizeItems = (apiItems) => {
    return (apiItems || []).map((item) => ({
      cartItemId: item.id,
      id: item.product?.id,
      name: item.product?.name,
      price: item.product?.price,
      stock: item.product?.stock ?? 0,
      imageUrl: item.product?.primaryImageUrl,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));
  };

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setItems(normalizeItems(data?.items || []));
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setError("Failed to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const syncCart = useCallback(async (guestItems) => {
    if (!isAuthenticated || guestItems.length === 0) return;
    setSyncing(true);
    try {
      await syncCartService(guestItems);
      await fetchCart();
    } catch (error) {
      console.error("Cart sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated, fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      const existingIndex = items.findIndex((item) => item.id === productId);
      if (existingIndex !== -1) {
        setItems((prev) =>
          prev.map((item, i) =>
            i === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
          )
        );
      } else {
        setItems((prev) => [...prev, { id: productId, quantity, cartItemId: `guest-${productId}` }]);
      }
      return;
    }
    await addItemService(productId, quantity);
    await fetchCart();
  };

  const updateItem = async (cartItemId, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
    );
    if (!isAuthenticated) return;
    try {
      await updateItemService(cartItemId, quantity);
    } catch (error) {
      await fetchCart();
      throw error;
    }
  };

  const removeItem = async (cartItemId) => {
    const previousItems = items;
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    if (!isAuthenticated) return;
    try {
      await removeItemService(cartItemId);
    } catch (error) {
      setItems(previousItems);
      throw error;
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

  const value = {
    items,
    loading,
    syncing,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    syncCart,
    fetchCart,
    itemCount,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};