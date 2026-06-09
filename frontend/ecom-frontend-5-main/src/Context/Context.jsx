import axios from "../axios";
import { useState, useEffect, createContext } from "react";

const AppContext = createContext({
  data: [],
  isError: "",
  cart: [],
  addToCart: (product) => {},
  removeFromCart: (productId) => {},
  refreshData: () => {},
  updateStockQuantity: (productId, newQuantity) => {},
  productsMeta: {
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
    pageSize: 12,
    first: true,
    last: true
  },
  setProductsMeta: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  selectedCategory: "",
  setSelectedCategory: () => {}
});

export const AppProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [isError, setIsError] = useState("");
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem("cart")) || []);
  const [productsMeta, setProductsMeta] = useState({
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
    pageSize: 12,
    first: true,
    last: true
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const updateProductsMeta = (meta) => {
    setProductsMeta({
      currentPage: meta?.currentPage ?? 0,
      totalPages: meta?.totalPages ?? 0,
      totalItems: meta?.totalItems ?? 0,
      pageSize: meta?.pageSize ?? 12,
      first: meta?.first ?? true,
      last: meta?.last ?? true
    });
  };

  const addToCart = (product) => {
    const existingProductIndex = cart.findIndex((item) => item.id === product.id);
    if (existingProductIndex !== -1) {
      const updatedCart = cart.map((item, index) =>
        index === existingProductIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } else {
      const updatedCart = [...cart, { ...product, quantity: 1 }];
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    }
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const refreshData = async (page = 0, size = 12) => {
    try {
      const response = await axios.get("/products", {
        params: {
          page,
          size,
          keyword: searchQuery || undefined,
          category: selectedCategory || undefined
        }
      });
      const pageData = response.data?.content ?? [];
      const meta = response.data;
      setData(Array.isArray(pageData) ? pageData : []);
      updateProductsMeta(meta);
    } catch (error) {
      setIsError(error.message);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  useEffect(() => {
    refreshData(0, productsMeta.pageSize);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  return (
    <AppContext.Provider
      value={{
        data,
        isError,
        cart,
        addToCart,
        removeFromCart,
        refreshData,
        clearCart,
        productsMeta,
        setProductsMeta: updateProductsMeta,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
