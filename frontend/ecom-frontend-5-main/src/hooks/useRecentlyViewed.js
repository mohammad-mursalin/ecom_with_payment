import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../Context/AuthContext";
import API from "../axios";
import { useToast } from "../components/Toast";

const GUEST_KEY = "mursalin_recently_viewed";
const MAX_GUEST = 10;

const useRecentlyViewed = ({ productId, trackOnMount = false } = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const readGuestItems = useCallback(() => {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const writeGuestItems = useCallback((nextItems) => {
    localStorage.setItem(GUEST_KEY, JSON.stringify(nextItems));
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isAuthenticated) {
        const response = await API.get("/users/me/recently-viewed", { params: { limit: 6 } });
        const data = Array.isArray(response.data) ? response.data : [];
        const normalized = data.map((entry) => ({
          id: entry.productId,
          name: entry.product?.name || "",
          primaryImageUrl: entry.product?.primaryImageUrl || "",
          price: entry.product?.price || 0,
          viewedAt: entry.viewedAt,
        }));
        setItems(normalized);
      } else {
        const guestItems = readGuestItems();
        setItems(guestItems);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load recently viewed items";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, readGuestItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const trackProduct = useCallback(
    async (targetProductId, productMeta = {}) => {
      if (!targetProductId) return;
      try {
        if (isAuthenticated) {
          await API.post("/users/me/recently-viewed", { productId: targetProductId });
          await fetchItems();
        } else {
          setItems((prev) => {
            const filtered = prev.filter((item) => item.id !== targetProductId);
            const next = [
              {
                id: targetProductId,
                name: productMeta.name || "",
                primaryImageUrl: productMeta.primaryImageUrl || "",
                price: productMeta.price || 0,
                viewedAt: new Date().toISOString(),
              },
              ...filtered,
            ].slice(0, MAX_GUEST);
            writeGuestItems(next);
            return next;
          });
        }
      } catch {
        // silent fail
      }
    },
    [isAuthenticated, fetchItems, writeGuestItems]
  );

  useEffect(() => {
    if (!trackOnMount || !productId) return;
    trackProduct(productId);
  }, [productId, trackOnMount, trackProduct]);

  const clearHistory = useCallback(async () => {
    try {
      if (isAuthenticated) {
        await API.delete("/users/me/recently-viewed");
      } else {
        localStorage.removeItem(GUEST_KEY);
      }
      setItems([]);
      toast.success("Recently viewed history cleared");
    } catch {
      toast.info("Failed to clear history");
    }
  }, [isAuthenticated, toast]);

  return {
    items,
    loading,
    error,
    trackProduct,
    clearHistory,
    refresh: fetchItems,
  };
};

export default useRecentlyViewed;