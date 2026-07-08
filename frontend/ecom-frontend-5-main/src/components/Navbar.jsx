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
  const userMenuRef = useRef(null);

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
    function handleClickOutside(event) {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
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
    <header className={`sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-default ${scrolled ? "shadow-md" : ""}`}>
      <nav className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingBasket className="w-6 h-6 text-primary" strokeWidth={2.5} />
            <span className="text-lg font-bold text-primary">Mursalin</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {visibleNavLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted hover:text-primary"
                    }`}
                  aria-label={link.name}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div ref={searchContainerRef} className="relative">
            {isMobile && !isMobileSearchOpen && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleSearchFocus}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-default bg-surface hover:bg-surface-elevated transition-colors"
                aria-label="Open search"
              >
                <Search className="w-5 h-5 text-muted" strokeWidth={2} />
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
                  className="w-64 lg:w-80 h-10 px-4 pr-10 rounded-lg border border-default bg-surface text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  aria-label="Search products"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded hover:bg-surface-elevated transition-colors"
                    aria-label="Clear search"
                  >
                    <SearchX className="w-4 h-4 text-muted" strokeWidth={2} />
                  </button>
                )}
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded hover:bg-surface-elevated transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4 text-muted" strokeWidth={2} />
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
                  className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated rounded-xl border border-default shadow-xl overflow-hidden z-50"
                >
                  <div className="max-h-96 overflow-y-auto p-2">
                    {showRecentSearches && !showSearchResults && recentSearches.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-2 py-1">
                          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Recent</span>
                          <button
                            type="button"
                            onClick={clearRecentSearches}
                            className="text-xs text-muted hover:text-danger transition-colors"
                          >
                            Clear all
                          </button>
                        </div>
                        {recentSearches.map((term, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-colors ${highlightedIndex === idx ? "bg-surface-elevated" : "hover:bg-surface-elevated"
                              }`}
                          >
                            <div
                              className="flex items-center gap-3 flex-1 min-w-0"
                              onClick={() => navigateToSearch(term)}
                            >
                              <Clock className="w-4 h-4 text-muted" strokeWidth={2} />
                              <span className="text-sm text-primary truncate">{term}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRecentSearch(term);
                              }}
                              className="p-1 rounded hover:bg-surface-elevated transition-colors"
                              aria-label={`Remove ${term}`}
                            >
                              <SearchX className="w-3.5 h-3.5 text-muted" strokeWidth={2} />
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
                            className="flex items-center gap-3 flex-1 min-w-0 px-2 py-2 rounded-lg hover:bg-surface-elevated transition-colors"
                            onClick={() => handleResultClick(product)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-muted" strokeWidth={2} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-primary truncate">{product.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryPillClass(idx)}`}>
                                  {product.category?.name || product.category?.slug || "General"}
                                </span>
                                <span className="text-xs font-semibold text-muted">{formatPrice(product.price)}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" strokeWidth={2} />
                          </Link>
                        ))}
                        {searchQuery && searchResults.length === 0 && (
                          <button
                            type="button"
                            onClick={() => navigateToSearch(searchQuery)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface-elevated transition-colors"
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

          <div className="relative shrink-0">
            <Link
              to="/cart"
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-default bg-surface hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5 text-primary" strokeWidth={2} />
              {isAuthenticated && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>

          <div className="relative shrink-0">
            <Link
              to="/wishlist"
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-default bg-surface hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Wishlist"
              title="View Wishlist"
            >
              <Heart className="w-5 h-5 text-primary" strokeWidth={2} />
              {isAuthenticated && wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {wishlistItems.length > 9 ? "9+" : wishlistItems.length}
                </span>
              )}
            </Link>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-default bg-surface hover:bg-surface-elevated transition-colors shrink-0"
            aria-label="Toggle Theme"
            title="Toggle Dark/Light Mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-primary" strokeWidth={2} />
            ) : (
              <Moon className="w-5 h-5 text-primary" strokeWidth={2} />
            )}
          </motion.button>

          <div className="hidden md:flex shrink-0">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setUserMenuOpen((prev) => !prev);
                    setShowSearchResults(false);
                    setShowRecentSearches(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-default bg-surface hover:bg-surface-elevated transition-colors"
                  aria-label="User Menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-elevated text-primary font-semibold text-sm">
                    {user?.username?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted transition-transform" strokeWidth={2} />
                </button>

                {userMenuOpen && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-surface-elevated rounded-xl border border-default shadow-xl overflow-hidden z-50"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors"
                      >
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <span className="block text-sm font-semibold text-primary">Profile</span>
                          <span className="block text-xs text-muted">Manage your account</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted" strokeWidth={2} />
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors"
                      >
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Heart className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <span className="block text-sm font-semibold text-primary">Wishlist</span>
                          <span className="block text-xs text-muted">View saved items</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted" strokeWidth={2} />
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors"
                        >
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Settings className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div className="flex-1">
                            <span className="block text-sm font-semibold text-primary">Admin Dashboard</span>
                            <span className="block text-xs text-muted">Manage products and orders</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted" strokeWidth={2} />
                        </Link>
                      )}
                      <div className="border-t border-default" />
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:text-red-700 hover:bg-surface-elevated transition-colors"
                      >
                        <LogOut className="w-5 h-5" strokeWidth={2} />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setShowSearchResults(false);
              setShowRecentSearches(false);
            }}
            className="flex md:hidden shrink-0 w-10 h-10 items-center justify-center rounded-lg border border-default bg-surface hover:bg-surface-elevated transition-colors"
            aria-label="Toggle Menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-primary" strokeWidth={2} />
            ) : (
              <Menu className="w-6 h-6 text-primary" strokeWidth={2} />
            )}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-65 h-screen opacity-96 bg-surface border-r border-default z-50 md:hidden"
              ref={mobileMenuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-default">
                  <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                    <ShoppingBasket className="w-6 h-6 text-primary" strokeWidth={2.5} />
                    <span className="text-lg font-bold text-primary">Mursalin</span>
                  </Link>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-default bg-surface hover:bg-surface-elevated transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-primary" strokeWidth={2} />
                  </button>
                </div>

                <div className="flex flex-col flex-1 gap-1 px-4 bg-surface">
                  {visibleNavLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        to={link.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-surface-elevated transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2} />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>

                {isAuthenticated && (
                  <>
                    <div className="border-t border-default" />
                    <div className="p-4 bg-surface">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-default bg-surface">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-base">
                          {user?.username?.charAt(0) || user?.email?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">{user?.username || user?.fullName || user?.email}</p>
                          <p className="text-xs text-muted">{user?.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full mt-3 px-4 py-3 rounded-lg text-sm font-medium text-left text-red-600 hover:text-red-700 bg-surface hover:bg-surface-elevated transition-colors"
                      >
                        <LogOut className="w-5 h-5" strokeWidth={2} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
