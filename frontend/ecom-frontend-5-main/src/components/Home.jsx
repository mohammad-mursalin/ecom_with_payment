import React, { useContext, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AppContext from "../Context/Context";
import { useToast } from "./Toast";
import { ShoppingBasket, Search, User, ChevronRight, Star, ArrowUpRight, ArrowDownRight, Grid, List, Heart, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Home = ({ selectedCategory }) => {
  const { data, isError, addToCart, refreshData, productsMeta, searchQuery, setSearchQuery } = useContext(AppContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");

  const currentPage = productsMeta?.currentPage ?? 0;
  const totalPages = productsMeta?.totalPages ?? 0;
  const pageSize = productsMeta?.pageSize ?? 12;

  const goToPage = useCallback((page) => {
    if (page < 0 || page >= totalPages) return;
    refreshData(page, pageSize);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [totalPages, pageSize, refreshData]);

  useEffect(() => {
    refreshData(0, pageSize);
  }, [selectedCategory]);

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBasket className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h2>
          <p className="text-gray-600 mb-6">We couldn't load the products at the moment. Please try again.</p>
          <button onClick={() => goToPage(0)} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto">
            <ArrowUpRight className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBasket className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Products Available</h2>
          <p className="text-gray-600 mb-6">We'll be adding more products soon. Check back later!</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
            <ArrowUpRight className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const features = [
    { icon: <Star className="w-8 h-8 text-yellow-500" />, title: "Premium Quality", description: "Carefully curated products for the best experience" },
    { icon: <ArrowDownRight className="w-8 h-8 text-blue-600" />, title: "Fast Delivery", description: "Quick and reliable shipping to your doorstep" },
    { icon: <ShoppingBasket className="w-8 h-8 text-green-600" />, title: "Secure Payments", description: "Safe and secure payment options" },
    { icon: <User className="w-8 h-8 text-purple-600" />, title: "24/7 Support", description: "Round-the-clock customer support" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2
             bg-white/20 backdrop-blur-sm
             rounded-full text-slate-900
             text-sm font-medium mb-6"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                New Products Arriving
              </span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-100 mb-6 leading-tight">
              Discover Amazing Products <span className="block mt-2">For Your Lifestyle</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
              Explore our wide range of products. Quality, reliability, and excellent customer service guaranteed.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="#" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                <ShoppingBasket className="w-5 h-5" />
                Shop Now
                <ArrowUpRight className="w-5 h-5" />
              </Link>
              <Link to="#" className="px-8 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition-all border-2 border-white/30 flex items-center justify-center gap-2">
                <Grid className="w-5 h-5" />
                View All Products
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="text-center p-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Shop by Category</h2>
            <p className="text-gray-600 dark:text-gray-400">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Laptops", icon: "💻", desc: "Latest laptops" },
              { name: "Headphones", icon: "🎧", desc: "Premium audio" },
              { name: "Mobile", icon: "📱", desc: "Smartphones" },
              { name: "Electronics", icon: "⚡", desc: "Gadgets" },
              { name: "Fashion", icon: "👗", desc: "Trends" },
              { name: "Accessories", icon: "💍", desc: "Accessories" },
            ].map((category, index) => (
              <button key={category.name} type="button" onClick={() => navigate(`/?category=${encodeURIComponent(category.name)}`)} className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 hover:shadow-xl transition-all w-full">
                <div className="text-left">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{searchQuery ? `Search: "${searchQuery}"` : `Products${selectedCategory ? ` · ${selectedCategory}` : ""}`}</h2>
              <p className="text-gray-600 dark:text-gray-400">{productsMeta?.totalItems ? `Page ${currentPage + 1} of ${totalPages} · ${productsMeta.totalItems} items` : `${data.length} products`}</p>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setViewMode("grid")} className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                <Grid className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => setViewMode("list")} className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {data.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try clearing search or filters</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {data.map((product, index) => {
                if (!product) return null;
                const { id, brand, name, price, productAvailable, imageUrl, productRating, productReviewCount } = product;

                return (
                  <motion.div key={id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }} className="product-card group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                    <div className="product-card-image-container aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-700 relative">
                      <Link to={`/product/${id}`}>
                        <img src={imageUrl} alt={name || "Product"} className="product-card-image w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                      </Link>
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        <span className={`stock-badge ${productAvailable ? "stock-in-stock" : "stock-out-of-stock"}`}>{productAvailable ? "In Stock" : "Out of Stock"}</span>
                        <button className="wishlist-btn w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors" aria-label="Add to wishlist">
                          <Heart className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col h-full">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{brand || "Brand"}</span>
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 line-clamp-2 leading-snug min-h-[44px]">
                        <Link to={`/product/${id}`} className="product-name hover:text-blue-600 transition-colors">{name || "Product"}</Link>
                      </h3>

                      <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(productRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({productReviewCount || 0} reviews)</span>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{price || 0}</span>
                        </div>
                        <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-2" onClick={(e) => { e.preventDefault(); addToCart(product); showToast("Product added to cart"); }} disabled={!productAvailable}>
                          <ShoppingBasket className="w-5 h-5" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} className="pagination-btn">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, page) => (
                <button key={page} type="button" onClick={() => goToPage(page)} className={`pagination-btn ${page === currentPage ? "pagination-btn-active" : ""}`}>
                  {page + 1}
                </button>
              ))}
              <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages - 1} className="pagination-btn">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShoppingBasket className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-white">Mursalin</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 Mursalin E-Commerce. All rights reserved. Made with ❤️</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;