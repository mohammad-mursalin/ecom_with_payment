import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../components/Toast";
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { getBrands } from "../services/brandService";
import FilterSidebar from "../components/FilterSidebar";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { usePagination } from "../hooks/usePagination";
import { X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Popular", value: "popular" },
  { label: "Best Rated", value: "rating" },
];

const DEFAULT_MAX_PRICE = 10000;

function parseArrayParam(value) {
  if (!value || typeof value !== "string") return [];
  return value.split(",").filter(Boolean);
}

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const toast = useToast().toast;

  const searchQuery = searchParams.get("search") || "";
  const categorySlugs = useMemo(
    () => parseArrayParam(searchParams.get("category")),
    [searchParams]
  );
  const brandSlugs = useMemo(
    () => parseArrayParam(searchParams.get("brand")),
    [searchParams]
  );
  const minRatingRaw = searchParams.get("minRating");
  const minRating = minRatingRaw ? Number(minRatingRaw) : undefined;
  const minPriceRaw = searchParams.get("minPrice");
  const minPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
  const maxPriceRaw = searchParams.get("maxPrice");
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 12,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeFilterCount = categorySlugs.length + brandSlugs.length + (minRating ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchBrands = useCallback(
    async (categorySlugsList = []) => {
      setLoadingBrands(true);
      try {
        let data = [];
        if (categorySlugsList.length === 1) {
          const cat = categories.find((c) => c.slug === categorySlugsList[0]);
          if (cat?.id) {
            data = await getBrands({ categoryId: cat.id });
          }
        } else {
          data = await getBrands();
        }
        setBrands(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch brands", err);
        setBrands([]);
      } finally {
        setLoadingBrands(false);
      }
    },
    [categories]
  );

  const fetchProducts = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError("");
      try {
        const pageVal = opts.page ?? page;
        const pageSizeVal = opts.pageSize ?? pageSize;
        const params = {
          page: pageVal,
          size: pageSizeVal,
          keyword: searchQuery || undefined,
          sort: opts.sort ?? sort,
        };
        if (categorySlugs.length > 0) {
          params.category = categorySlugs.join(",");
        }
        if (brandSlugs.length > 0) {
          params.brand = brandSlugs.join(",");
        }
        if (minRating !== undefined) {
          params.minRating = minRating;
        }
        if (minPrice !== undefined) {
          params.minPrice = minPrice;
        }
        if (maxPrice !== undefined) {
          params.maxPrice = maxPrice;
        }

        const data = await getProducts(params);
        const content = Array.isArray(data?.content) ? data.content : [];
        setProducts(content);
        setMeta({
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
          currentPage: data?.currentPage ?? pageVal,
          pageSize: data?.pageSize ?? pageSizeVal,
        });
      } catch (err) {
        setError("Failed to load products. Please try again.");
        if (toast?.error) toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, searchQuery, categorySlugs, brandSlugs, minRating, minPrice, maxPrice, sort, toast]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchBrands(categorySlugs);
  }, [categorySlugs, fetchBrands]);

  useEffect(() => {
    fetchProducts({
      page,
      pageSize,
      sort,
      search: searchQuery,
      categories: categorySlugs,
      brands: brandSlugs,
      minRating,
      minPrice,
      maxPrice,
    });
  }, [page, pageSize, sort, searchQuery, categorySlugs, brandSlugs, minRating, minPrice, maxPrice, fetchProducts]);

  const handleFilterChange = useCallback(
    (nextFilters) => {
      setPage(0);
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (nextFilters.search) {
            updated.set("search", nextFilters.search);
          } else {
            updated.delete("search");
          }
          if (nextFilters.categories && nextFilters.categories.length > 0) {
            updated.set("category", nextFilters.categories.join(","));
          } else {
            updated.delete("category");
          }
          if (nextFilters.brands && nextFilters.brands.length > 0) {
            updated.set("brand", nextFilters.brands.join(","));
          } else {
            updated.delete("brand");
          }
          if (nextFilters.minRating !== undefined) {
            updated.set("minRating", String(nextFilters.minRating));
          } else {
            updated.delete("minRating");
          }
          if (nextFilters.minPrice !== undefined) {
            updated.set("minPrice", String(nextFilters.minPrice));
          } else {
            updated.delete("minPrice");
          }
          if (nextFilters.maxPrice !== undefined) {
            updated.set("maxPrice", String(nextFilters.maxPrice));
          } else {
            updated.delete("maxPrice");
          }
          if (nextFilters.sort && nextFilters.sort !== "newest") {
            updated.set("sort", nextFilters.sort);
          } else {
            updated.delete("sort");
          }
          updated.set("page", "0");
          if (nextFilters.pageSize && nextFilters.pageSize !== 12) {
            updated.set("pageSize", String(nextFilters.pageSize));
          } else {
            updated.delete("pageSize");
          }
          return updated;
        },
        { replace: true }
      );
      setMobileFilterOpen(false);
    },
    [setPage, setSearchParams]
  );

  const handleSortChange = (e) => {
    const nextSort = e.target.value;
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev);
        if (nextSort && nextSort !== "newest") {
          updated.set("sort", nextSort);
        } else {
          updated.delete("sort");
        }
        updated.set("page", "0");
        return updated;
      },
      { replace: true }
    );
  };

  const clearAll = () => {
    const toRemove = ["category", "brand", "minRating", "minPrice", "maxPrice", "sort", "page", "pageSize"];
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev);
        toRemove.forEach((key) => updated.delete(key));
        if (searchQuery) {
          updated.set("search", searchQuery);
        }
        updated.set("page", "0");
        return updated;
      },
      { replace: true }
    );
    setPage(0);
    setMobileFilterOpen(false);
  };

  const startElement = meta.totalElements === 0 ? 0 : meta.currentPage * meta.pageSize + 1;
  const endElement = Math.min((meta.currentPage + 1) * meta.pageSize, meta.totalElements);

  const showSortInHeader = searchQuery || activeFilterCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {searchQuery && (
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              Search results for &#39;{searchQuery}&#39;
            </h1>
            <p className="text-muted mt-1">
              {meta.totalElements} {meta.totalElements === 1 ? "product" : "products"} found
            </p>
          </div>
        )}

        {!searchQuery && (
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">All Products</h1>
            <p className="text-muted mt-1">
              {meta.totalElements} {meta.totalElements === 1 ? "product" : "products"} available
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                filters={{
                  search: searchQuery,
                  categories: categorySlugs,
                  brands: brandSlugs,
                  minRating,
                  minPrice,
                  maxPrice,
                }}
                onChange={handleFilterChange}
                maxPrice={DEFAULT_MAX_PRICE}
                categories={categories}
                brands={brands}
                isLoadingCategories={loadingCategories}
                isLoadingBrands={loadingBrands}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-elevated md:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-xs font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {showSortInHeader && (
                  <span className="text-sm text-muted">
                    {startElement}–{endElement} of {meta.totalElements} results
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {showSortInHeader && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort-select" className="text-sm text-muted">Sort:</label>
                    <select
                      id="sort-select"
                      value={sort}
                      onChange={handleSortChange}
                      className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="product-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorState
                title="Failed to load products"
                message={error}
                onRetry={() => fetchProducts({ page, pageSize })}
              />
            ) : products.length === 0 ? (
              <EmptyState
                icon={SlidersHorizontal}
                title="No Products Found"
                description="Try adjusting your filters or search query"
                actionLabel="Clear Filters"
                onAction={clearAll}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Pagination
                  currentPage={meta.currentPage}
                  totalPages={meta.totalPages}
                  totalElements={meta.totalElements}
                  pageSize={meta.pageSize}
                  onPageChange={(next) => setPage(next)}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(0);
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileFilterOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-surface-elevated rounded-t-3xl max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-surface-elevated px-4 py-3 border-b border-default flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
              </div>
              <div className="p-4">
                <FilterSidebar
                  filters={{
                    search: searchQuery,
                    categories: categorySlugs,
                    brands: brandSlugs,
                    minRating,
                    minPrice,
                    maxPrice,
                  }}
                  onChange={handleFilterChange}
                  maxPrice={DEFAULT_MAX_PRICE}
                  categories={categories}
                  brands={brands}
                  isLoadingCategories={loadingCategories}
                  isLoadingBrands={loadingBrands}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsPage;