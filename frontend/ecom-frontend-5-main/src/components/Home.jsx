import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { getCategories } from "../services/categoryService";
import { getProducts } from "../services/productService";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import CategoryCardSkeleton from "./CategoryCardSkeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

const trustBadgeIcons = {
  shipping: "🚚",
  secure: "🔒",
  returns: "↩️",
  support: "📱"
};

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState("");

  const [newArrivals, setNewArrivals] = useState([]);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(true);
  const [newArrivalsError, setNewArrivalsError] = useState("");

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError("");
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load categories";
      setCategoriesError(msg);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchFeaturedProducts = useCallback(async () => {
    setFeaturedLoading(true);
    setFeaturedError("");
    try {
      const data = await getProducts({ isFeatured: true, size: 8 });
      const items = data?.content ?? [];
      setFeaturedProducts(Array.isArray(items) ? items : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load featured products";
      setFeaturedError(msg);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  const fetchNewArrivals = useCallback(async () => {
    setNewArrivalsLoading(true);
    setNewArrivalsError("");
    try {
      const data = await getProducts({ sort: "newest", size: 8 });
      const items = data?.content ?? [];
      setNewArrivals(Array.isArray(items) ? items : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load new arrivals";
      setNewArrivalsError(msg);
    } finally {
      setNewArrivalsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    fetchNewArrivals();
  }, [fetchNewArrivals]);

  const trustBadges = [
    { icon: trustBadgeIcons.shipping, label: "Free Shipping" },
    { icon: trustBadgeIcons.secure, label: "Secure Payment" },
    { icon: trustBadgeIcons.returns, label: "Easy Returns" },
    { icon: trustBadgeIcons.support, label: "24/7 Support" }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <section className="py-5 py-md-6 text-center text-white" style={{ backgroundColor: "var(--color-brand)" }}>
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">Discover Amazing Products</h1>
          <p className="lead mb-4 mb-md-5">Quality products for your lifestyle, delivered to your doorstep</p>
          <Link to="/products" className="btn btn-light btn-lg fw-semibold">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="py-5" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="container">
          <h2 className="h3 fw-bold mb-4 mb-md-5 text-center text-md-start" style={{ color: "var(--text-primary)" }}>
            Categories
          </h2>
          <div className="row g-3 g-md-4">
            {categoriesLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col-6 col-md-4 col-lg-3">
                  <CategoryCardSkeleton />
                </div>
              ))
            ) : categoriesError ? (
              <div className="col-12">
                <ErrorState
                  title="Failed to load categories"
                  message={categoriesError}
                  onRetry={() => fetchCategories()}
                />
              </div>
            ) : categories.length === 0 ? (
              <div className="col-12">
                <EmptyState
                  icon={Package}
                  title="No categories available"
                  description="Categories will be added soon. Check back later!"
                  actionLabel="Browse Products"
                  actionHref="/products"
                />
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="col-6 col-md-4 col-lg-3">
                  <Link
                    to={`/products?category=${category.id}`}
                    className="text-decoration-none"
                  >
                    <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
                      <div className="card-body text-center p-3 p-md-4">
                        <div className="mb-2 fs-1">
                          {category.icon || category.emoji || "📦"}
                        </div>
                        <h6 className="card-title mb-0 fw-semibold" style={{ color: "var(--text-primary)" }}>
                          {category.name}
                        </h6>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 mb-md-5">
            <div>
              <h2 className="h3 fw-bold mb-1" style={{ color: "var(--text-primary)" }}>Featured Products</h2>
              <p className="text-muted mb-0">Handpicked for you</p>
            </div>
            <Link to="/products" className="text-primary fw-medium mt-2 mt-md-0">
              View All →
            </Link>
          </div>

<div className="row g-3 g-md-4 row-cols-2 row-cols-md-4">
            {featuredLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : featuredError ? (
              <div className="col-12">
                <ErrorState
                  title="Failed to load featured products"
                  message={featuredError}
                  onRetry={() => fetchFeaturedProducts()}
                />
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="col-12">
                <EmptyState
                  icon={Package}
                  title="No featured products available"
                  description="Check back later for handpicked products or browse all products."
                  actionLabel="Browse Products"
                  actionHref="/products"
                />
              </div>
            ) : (
              featuredProducts.map((product) => (
                <div key={product.id} className="col">
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-5" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 mb-md-5">
            <div>
              <h2 className="h3 fw-bold mb-1" style={{ color: "var(--text-primary)" }}>New Arrivals</h2>
              <p className="text-muted mb-0">Latest additions to our collection</p>
            </div>
            <Link to="/products" className="text-primary fw-medium mt-2 mt-md-0">
              View All →
            </Link>
          </div>

<div className="row g-3 g-md-4 row-cols-2 row-cols-md-4">
            {newArrivalsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : newArrivalsError ? (
              <div className="col-12">
                <ErrorState
                  title="Failed to load new arrivals"
                  message={newArrivalsError}
                  onRetry={() => fetchNewArrivals()}
                />
              </div>
            ) : newArrivals.length === 0 ? (
              <div className="col-12">
                <EmptyState
                  icon={Package}
                  title="No new arrivals available"
                  description="Be the first to know when new products arrive. Check back soon!"
                  actionLabel="Browse Products"
                  actionHref="/products"
                />
              </div>
            ) : (
              newArrivals.map((product) => (
                <div key={product.id} className="col">
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-4 py-md-5">
        <div className="container">
          <div className="row g-3 g-md-4 text-center justify-content-center">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="col-6 col-md-3">
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-2">
                  <span className="fs-3">{badge.icon}</span>
                  <span className="fw-medium" style={{ color: "var(--text-primary)" }}>
                    {badge.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-3 py-md-4" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <hr className="my-0" style={{ borderColor: "var(--border-color)" }} />
        <div className="container text-center py-3">
          <p className="mb-0" style={{ color: "var(--text-muted)" }}>
            &copy; {new Date().getFullYear()} Mursalin E-Commerce. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;