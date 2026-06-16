import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getWishlist, addToWishlist, removeFromWishlist } from "../services/wishlistService";

const WishlistContext = createContext(null);

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  const normalizeItems = (apiItems) => {
    return (apiItems || []).map((item) => ({
      productId: item.productId || item.id,
      id: item.id,
      ...item,
    }));
  };

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getWishlist();
      setItems(normalizeItems(data?.items || data || []));
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load wishlist";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggle = async (productId) => {
    const wasInWishlist = isInWishlist(productId);
    const previousItems = items;

    if (wasInWishlist) {
      setItems((prev) => prev.filter((item) => item.productId !== productId && item.id !== productId));
    } else {
      setItems((prev) => [...prev, { productId }]);
    }

    try {
      if (wasInWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
      await refreshWishlist();
    } catch (error) {
      setItems(previousItems);
      throw error;
    }
  };

  const isInWishlist = useCallback(
    (productId) => items.some((item) => item.productId === productId || item.id === productId),
    [items]
  );

  const value = {
    items,
    loading,
    error,
    toggle,
    isInWishlist,
    refreshWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};