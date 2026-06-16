import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "./Toast";
import { useTheme } from "../hooks/useTheme";
import { useCart } from "../Context/CartContext";
import { useWishlist } from "../Context/WishlistContext";
import { searchSuggestions } from "../services/productService";
import {
  ShoppingBasket,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Package,
  ShoppingCart,
  Heart,
  Settings,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun,
  SearchX,
  Search,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function useFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    
    firstFocusableRef.current = firstFocusable;
    lastFocusableRef.current = lastFocusable;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (focusable.length === 0) return;
        
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return containerRef;
}

const RECENT_SEARCHES_KEY = "mursalin_recent_searches";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const mobileMenuRef = useFocusTrap(isMenuOpen, () => setIsMenuOpen(false));

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
        setShowRecentSearches(false);
        setHighlightedIndex(-1);
      }
      if (userMenuOpen && !event.target.closest(".user-menu-container")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const saveRecentSearch = useCallback(
    (query) => {
      if (!query || !query.trim()) return;
      const q = query.trim();
      setRecentSearches((prev) => {
        const next = [q, ...prev.filter((s) => s !== q)].slice(0, 5);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeRecentSearch = useCallback((query) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const fetchSuggestions = useCallback(
    async (query) => {
      const q = (query || "").trim();
      if (q.length < 1) {
        setSearchResults([]);
        return;
      }
      try {
        const data = await searchSuggestions(q, 8);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      }
    },
    []
  );

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (value.trim().length >= 1) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value);
        setShowRecentSearches(false);
      }, 350);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 1) {
      setShowSearchResults(true);
      setShowRecentSearches(false);
    } else {
      setShowRecentSearches(recentSearches.length > 0);
      setShowSearchResults(false);
    }
    if (isMobile && !isMobileSearchOpen) {
      setIsMobileSearchOpen(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setHighlightedIndex(-1);
    if (!isMobile || isMobileSearchOpen) {
      searchInputRef.current?.focus();
    }
  };

  const navigateToSearch = (query) => {
    const q = (query || searchQuery || "").trim();
    if (!q) return;
    saveRecentSearch(q);
    setSearchQuery(q);
    setShowSearchResults(false);
    setShowRecentSearches(false);
    setHighlightedIndex(-1);
    setIsMobileSearchOpen(false);
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleResultClick = (product) => {
    saveRecentSearch(searchQuery);
    setShowSearchResults(false);
    setShowRecentSearches(false);
    setHighlightedIndex(-1);
    setIsMobileSearchOpen(false);
    navigate(`/products/${product.id}`);
  };

  const handleKeyDown = (e) => {
    const maxIndex = searchResults.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
        handleResultClick(searchResults[highlightedIndex]);
      } else {
        navigateToSearch(searchQuery);
      }
    } else if (e.key === "Escape") {
      setShowSearchResults(false);
      setShowRecentSearches(false);
      setHighlightedIndex(-1);
      setIsMobileSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate("/");
    toast.success("Logged out successfully");
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Products", href: "/products", icon: Package },
    { name: "Orders", href: "/orders", icon: ShoppingCart, auth: true },
  ];

  const visibleNavLinks = navLinks.filter((link) => !link.auth || isAuthenticated);

  const isDark = theme === "dark";

  const formatPrice = (value) => {
    const num = typeof value === "number" ? value : Number(value || 0);
    return `₹${num.toFixed(2)}`;
  };

  const getCategoryPillClass = (index) => {
    const palettes = [
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-indigo-100 text-indigo-700",
    ];
    return palettes[index % palettes.length];
  };

  useEffect(() => {
    setShowRecentSearches(false);
    setHighlightedIndex(-1);
    if (!isMobile) {
      setIsMobileSearchOpen(false);
    }
  }, [location.pathname, isMobile]);

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
            {visibleNavLinks.map((link) => {
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
            <div ref={searchContainerRef} className="search-container">
              {isMobile && !isMobileSearchOpen && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleSearchFocus}
                  className="nav-action-btn"
                  aria-label="Open search"
                >
                  <Search className="nav-action-icon" />
                </motion.button>
              )}

              {(isMobileSearchOpen || !isMobile) && (
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                    aria-label="Search products"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="search-clear"
                      aria-label="Clear search"
                    >
                      <SearchX className="w-4 h-4" />
                    </button>
                  )}
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => setIsMobileSearchOpen(false)}
                      className="search-clear"
                      aria-label="Close search"
                      style={{ right: searchQuery ? "28px" : "8px" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <AnimatePresence>
                {(showRecentSearches || showSearchResults) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="search-results-dropdown"
                  >
                    <div className="max-h-96 overflow-y-auto p-2">
                      {showRecentSearches && !showSearchResults && recentSearches.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between px-2 py-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent</span>
                            <button
                              type="button"
                              onClick={clearRecentSearches}
                              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                            >
                              Clear all
                            </button>
                          </div>
                          {recentSearches.map((term, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                                highlightedIndex === idx ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                            >
                              <div
                                className="flex items-center gap-3 flex-1"
                                onClick={() => navigateToSearch(term)}
                              >
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">{term}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRecentSearch(term);
                                }}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                aria-label={`Remove ${term}`}
                              >
                                <SearchX className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {showSearchResults && (
                        <div>
                          {searchResults.map((product, idx) => (
                            <Link
                              key={product.id}
                              to={`/products/${product.id}`}
                              className="search-result-item"
                              onClick={() => handleResultClick(product)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryPillClass(idx)}`}>
                                      {product.category?.name || product.category?.slug || "General"}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{formatPrice(product.price)}</span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </Link>
                          ))}
                          {searchQuery && searchResults.length === 0 && (
                            <button
                              type="button"
                              onClick={() => navigateToSearch(searchQuery)}
                              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              Search for &ldquo;{searchQuery}&rdquo;
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link
              to="/cart"
              className={`nav-action-btn cart-btn ${isAuthenticated ? "" : "disabled"}`}
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingCart className="nav-action-icon" />
              {isAuthenticated && itemCount > 0 && (
                <span className="cart-badge" aria-label={`${itemCount} items in cart`}>
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className={`nav-action-btn wishlist-btn ${isAuthenticated ? "" : "disabled"}`}
              aria-label="Wishlist"
              title="View Wishlist"
            >
              <Heart className="nav-action-icon" />
              {isAuthenticated && wishlistItems.length > 0 && (
                <span className="wishlist-badge" aria-label={`${wishlistItems.length} items in wishlist`}>
                  {wishlistItems.length}
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
              {isDark ? (
                <Sun className="theme-icon" />
              ) : (
                <Moon className="theme-icon" />
              )}
            </motion.button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="user-menu-container">
                <button
                  onClick={() => {
                    setUserMenuOpen((prev) => !prev);
                    setShowSearchResults(false);
                    setShowRecentSearches(false);
                  }}
                  className="user-menu-btn"
                  aria-label="User Menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="user-avatar">
                    {user?.username?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                  <span className="user-name">{user?.username || user?.fullName || user?.email}</span>
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
                      <Link
                        to="/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="user-dropdown-item"
                      >
                        <Heart className="user-dropdown-icon" />
                        <div className="user-dropdown-content">
                          <span className="user-dropdown-title">Wishlist</span>
                          <span className="user-dropdown-subtitle">View saved items</span>
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
                  <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Login
                  </motion.span>
                </Link>
                <Link
                  to="/register"
                  className="auth-btn auth-btn-register"
                  aria-label="Register"
                >
                  <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <span>Register</span>
                    <ChevronRight className="auth-btn-arrow" />
                  </motion.span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                setShowSearchResults(false);
                setShowRecentSearches(false);
              }}
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
              aria-hidden="true"
            />
<motion.div
               initial={{ x: "-100%" }}
               animate={{ x: 0 }}
               exit={{ x: "-100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="mobile-menu"
               ref={mobileMenuRef}
               role="dialog"
               aria-modal="true"
               aria-label="Mobile navigation menu"
           >
              <div className="mobile-menu-header">
                <Link to="/" className="mobile-logo" onClick={() => setIsMenuOpen(false)}>
                  <ShoppingBasket className="mobile-logo-icon" />
                  <span className="mobile-logo-text">Mursalin</span>
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="mobile-close-btn"
                  aria-label="Close menu"
                >
                  <X className="mobile-close-icon" />
                </button>
              </div>

              <div className="mobile-nav-links">
                {visibleNavLinks.map((link) => {
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
                      {user?.username?.charAt(0) || user?.email?.charAt(0)}
                    </div>
                    <div className="mobile-user-info">
                      <p className="mobile-user-name">{user?.username || user?.fullName || user?.email}</p>
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
    </header>
  );
};

export default Navbar;
