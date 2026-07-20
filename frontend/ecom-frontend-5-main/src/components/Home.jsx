import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, Lock, RotateCcw, Headset } from "lucide-react";
import { getCategories } from "../services/categoryService";
import { getFeaturedProducts, getProducts } from "../services/productService";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import CategoryCardSkeleton from "./CategoryCardSkeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

const trustBadgeIcons = {
  shipping: Truck,
  secure: Lock,
  returns: RotateCcw,
  support: Headset
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
      const data = await getFeaturedProducts(8);
      const items = Array.isArray(data) ? data : [];
      setFeaturedProducts(items);
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
    <div className="min-h-screen bg-background">
      <section className="py-12 md:py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-4">Discover Amazing Products</h1>
          <p className="text-base text-secondary mb-6">Quality products for your lifestyle, delivered to your doorstep</p>
          <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover dark:shadow-none">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-primary mb-6">Categories</h2>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {categoriesLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <CategoryCardSkeleton />
                </div>
              ))
            ) : categoriesError ? (
              <div className="col-span-12">
                <ErrorState
                  title="Failed to load categories"
                  message={categoriesError}
                  onRetry={() => fetchCategories()}
                />
              </div>
            ) : categories.length === 0 ? (
              <div className="col-span-12">
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
                <div key={category.id} className="flex flex-col items-center gap-2">
                  <Link
                    to={`/products?category=${category.id}`}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm hover:shadow-md transition-shadow w-40 text-center dark:shadow-none">
                      <div className="text-3xl mb-2">
                        {category.icon || category.emoji || "📦"}
                      </div>
                      <h6 className="font-semibold text-primary mb-0">
                        {category.name}
                      </h6>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">Featured Products</h2>
              <p className="text-sm text-muted">Handpicked for you</p>
            </div>
            <Link to="/products" className="text-primary hover:text-primary-hover font-medium">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <ProductCardSkeleton />
                </div>
              ))
            ) : featuredError ? (
              <div className="col-span-12">
                <ErrorState
                  title="Failed to load featured products"
                  message={featuredError}
                  onRetry={() => fetchFeaturedProducts()}
                />
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-12">
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
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">New Arrivals</h2>
              <p className="text-sm text-muted">Latest additions to our collection</p>
            </div>
            <Link to="/products" className="text-primary hover:text-primary-hover font-medium">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivalsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <ProductCardSkeleton />
                </div>
              ))
            ) : newArrivalsError ? (
              <div className="col-span-12">
                <ErrorState
                  title="Failed to load new arrivals"
                  message={newArrivalsError}
                  onRetry={() => fetchNewArrivals()}
                />
              </div>
            ) : newArrivals.length === 0 ? (
              <div className="col-span-12">
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
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:flex md:flex-row md:justify-center md:gap-10">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-sm text-secondary">
                <badge.icon className="w-5 h-5 text-muted" />
                <span className="font-medium">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;