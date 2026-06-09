import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../axios";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "./Toast";
import { ShoppingBasket, Search, User, LogOut, Menu, X, Home, Package, ShoppingCart, CheckCircle, Award, CreditCard, Settings, ChevronDown, ChevronRight, Star, Sparkles, Moon, Sun, Bell, BellRing, SearchX, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ onSelectCategory }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const isDark = document.body.classList.contains("dark-theme");
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try {
        const cartItems = JSON.parse(storedCart);
        setCartCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
      } catch (error) {
        console.error("Error parsing cart:", error);
      }
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  };

  const categories = [
    { name: "Laptops", href: "#" },
    { name: "Headphones", href: "#" },
    { name: "Mobile", href: "#" },
    { name: "Electronics", href: "#" },
    { name: "Fashion", href: "#" },
    { name: "Accessories", href: "#" },
  ];

  const handleSearch = async (query) => {
    if (query.length >= 1) {
      try {
        const response = await API.get(`/products/search?keyword=${query}`);
        setSearchResults(response.data?.content ?? response.data ?? []);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setShowSearchResults(false);
      }
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate("/");
    showToast("Logged out successfully");
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Products", href: "/product", icon: Layers },
    { name: "Orders", href: "/orders", icon: Package },
  ];

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <nav className="navbar-container">
        <div className="navbar-content">
          {/* Left Section - Logo */}
          <Link to="/" className="nav-logo">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="logo-icon"
            >
              <ShoppingBasket className="logo-icon-svg" />
            </motion.div>
            <span className="logo-text">Mursalin</span>
          </Link>

          {/* Center Section - Navigation Links */}
          <nav className="nav-links">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  aria-label={link.name}
                >
                  <Icon className="nav-link-icon" />
                  <span className="nav-link-text">{link.name}</span>
                  {isActive && <span className="active-indicator" />}
                </Link>
              );
            })}
          </nav>

          {/* Right Section - Actions */}
          <div className="nav-actions">
            {/* Search */}
            <div className="search-container" onMouseLeave={() => setShowSearchResults(false)}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    handleSearch(value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true);
                    setIsSearchOpen(true);
                  }}
                  className="search-input"
                  aria-label="Search products"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                      setSearchResults([]);
                    }}
                    className="search-clear"
                    aria-label="Clear search"
                  >
                    <SearchX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  <div className="max-h-96 overflow-y-auto p-2">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="search-result-item"
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearchResults(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        {product.imageUrl && (
                          <div className="product-card-image-container">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="product-card-image"
                            />
                          </div>
                        )}
                        <div className="product-card-info">
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {product.brand}
                          </p>
                          <span className="price-tag inline-block mt-2">
                            ₹{product.price}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <Link
              to="/cart"
              className={`nav-action-btn cart-btn ${isAuthenticated ? "" : "disabled"}`}
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingCart className="nav-action-icon" />
              {isAuthenticated && cartCount > 0 && (
                <span className="cart-badge" aria-label={`${cartCount} items in cart`}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="nav-action-btn theme-btn"
              aria-label="Toggle Theme"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? (
                <Sun className="theme-icon" />
              ) : (
                <Moon className="theme-icon" />
              )}
            </motion.button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="user-menu-container">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="user-menu-btn"
                  aria-label="User Menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="user-avatar">
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                  <span className="user-name">{user?.fullName || user?.email}</span>
                  <ChevronDown className="user-chevron" />
                </button>

                {userMenuOpen && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="user-dropdown"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="user-dropdown-item"
                      >
                        <User className="user-dropdown-icon" />
                        <div className="user-dropdown-content">
                          <span className="user-dropdown-title">Profile</span>
                          <span className="user-dropdown-subtitle">Manage your account</span>
                        </div>
                        <ChevronRight className="user-dropdown-chevron" />
                      </Link>
                      <div className="user-dropdown-divider" />
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="user-dropdown-item"
                        >
                          <Settings className="user-dropdown-icon" />
                          <div className="user-dropdown-content">
                            <span className="user-dropdown-title">Admin Dashboard</span>
                            <span className="user-dropdown-subtitle">Manage products and orders</span>
                          </div>
                          <ChevronRight className="user-dropdown-chevron" />
                        </Link>
                      )}
                      <div className="user-dropdown-divider" />
                      <button
                        onClick={handleLogout}
                        className="user-dropdown-item text-red-600 hover:text-red-700"
                      >
                        <LogOut className="user-dropdown-icon" />
                        <div className="user-dropdown-content">
                          <span className="user-dropdown-title">Logout</span>
                        </div>
                        <ChevronRight className="user-dropdown-chevron" />
                      </button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link
                  to="/login"
                  className="auth-btn auth-btn-login"
                  aria-label="Login"
                >
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.span>
                </Link>
                <Link
                  to="/register"
                  className="auth-btn auth-btn-register"
                  aria-label="Register"
                >
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Register</span>
                    <ChevronRight className="auth-btn-arrow" />
                  </motion.span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mobile-menu-btn"
              aria-label="Toggle Menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="mobile-menu-icon" />
              ) : (
                <Menu className="mobile-menu-icon" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mobile-menu-overlay"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="mobile-menu"
            >
              <div className="mobile-menu-header">
                <Link to="/" className="mobile-logo" onClick={() => setIsMenuOpen(false)}>
                  <ShoppingBasket className="mobile-logo-icon" />
                  <span className="mobile-logo-text">Mursalin</span>
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="mobile-close-btn"
                >
                  <X className="mobile-close-icon" />
                </button>
              </div>

              <div className="mobile-nav-links">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="mobile-nav-link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="mobile-nav-link-icon" />
                      <span className="mobile-nav-link-text">{link.name}</span>
                    </Link>
                  );
                })}
              </div>

              {isAuthenticated && (
                <>
                  <div className="mobile-menu-divider" />
                  <div className="mobile-user-section">
                    <div className="mobile-user-avatar">
                      {user?.fullName?.charAt(0) || user?.email?.charAt(0)}
                    </div>
                    <div className="mobile-user-info">
                      <p className="mobile-user-name">{user?.fullName || user?.email}</p>
                      <p className="mobile-user-role">{user?.role}</p>
                    </div>
                  </div>

                  <div className="mobile-menu-divider" />
                  <button
                    onClick={handleLogout}
                    className="mobile-logout-btn"
                  >
                    <LogOut className="mobile-logout-icon" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Results Dropdown */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="search-results-dropdown">
          <div className="max-h-96 overflow-y-auto p-2">
            {searchResults.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="search-result-item"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                  setIsMenuOpen(false);
                }}
              >
                {product.imageUrl && (
                  <div className="product-card-image-container">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="product-card-image"
                    />
                  </div>
                )}
                <div className="product-card-info">
                  <h4 className="font-bold text-gray-900 dark:text-white">{product.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</p>
                  <span className="price-tag inline-block mt-2">₹{product.price}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;