import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import Skeleton from "./Skeleton";

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const FilterSidebar = ({
  filters,
  onChange,
  maxPrice = 10000,
  categories = [],
  brands = [],
  isLoadingCategories,
  isLoadingBrands,
}) => {
  const [localMin, setLocalMin] = useState(filters.minPrice ?? "");
  const [localMax, setLocalMax] = useState(filters.maxPrice ?? "");
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const minRef = useRef(null);
  const maxRef = useRef(null);
  const trackRef = useRef(null);

  const debouncedMin = useDebouncedValue(localMin, 500);
  const debouncedMax = useDebouncedValue(localMax, 500);

  useEffect(() => {
    const nextMin = debouncedMin === "" ? undefined : Number(debouncedMin);
    const nextMax = debouncedMax === "" ? undefined : Number(debouncedMax);
    if (
      nextMin !== (filters.minPrice ?? undefined) ||
      nextMax !== (filters.maxPrice ?? undefined)
    ) {
      onChange({
        ...filters,
        minPrice: nextMin,
        maxPrice: nextMax,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax]);

  const hasActiveFilters =
    (filters.categories && filters.categories.length > 0) ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    (filters.brands && filters.brands.length > 0) ||
    filters.minRating !== undefined;

  const handleCategoryToggle = (slug) => {
    const current = filters.categories || [];
    const next = current.includes(slug)
      ? current.filter((c) => c !== slug)
      : [...current, slug];
    onChange({ ...filters, categories: next });
  };

  const handleBrandToggle = (slug) => {
    const current = filters.brands || [];
    const next = current.includes(slug)
      ? current.filter((b) => b !== slug)
      : [...current, slug];
    onChange({ ...filters, brands: next });
  };

  const handleRatingChange = (value) => {
    const next = filters.minRating === value ? undefined : value;
    onChange({ ...filters, minRating: next });
  };

  const clearAll = () => {
    setLocalMin("");
    setLocalMax("");
    setCategorySearch("");
    setBrandSearch("");
    onChange({
      ...filters,
      categories: [],
      minPrice: undefined,
      maxPrice: undefined,
      brands: [],
      minRating: undefined,
    });
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const handleMinSliderChange = (e) => {
    const val = Number(e.target.value);
    setLocalMin(val);
  };
  const handleMaxSliderChange = (e) => {
    const val = Number(e.target.value);
    setLocalMax(val);
  };

  const minSlider = localMin === "" ? 0 : Number(localMin);
  const maxSlider = localMax === "" ? maxPrice : Number(localMax);

  const sliderMin = Math.min(minSlider, maxSlider);
  const sliderMax = Math.max(minSlider, maxSlider);

  const lowerPercent = maxPrice > 0 ? (sliderMin / maxPrice) * 100 : 0;
  const upperPercent = maxPrice > 0 ? (sliderMax / maxPrice) * 100 : 100;

  return (
    <aside className="w-full bg-surface-elevated rounded-2xl border border-default p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 text-sm font-medium text-danger hover:text-danger/80 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Category</h3>
        <input
          type="text"
          placeholder="Search categories..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {isLoadingCategories ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Skeleton width="16px" height="16px" rounded />
                  <Skeleton width="70%" height="14px" rounded />
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <p className="text-sm text-muted">No categories found</p>
          ) : (
            filteredCategories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(filters.categories || []).includes(cat.slug)}
                  onChange={() => handleCategoryToggle(cat.slug)}
                  className="h-4 w-4 rounded border border-default bg-surface-card text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-primary group-hover:text-primary/80 transition-colors">
                  {cat.name}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Price Range</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-secondary mb-1">Min</label>
              <input
                type="number"
                min={0}
                max={maxPrice}
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <span className="text-muted mt-5">–</span>
            <div className="flex-1">
              <label className="block text-xs font-medium text-secondary mb-1">Max</label>
              <input
                type="number"
                min={0}
                max={maxPrice}
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={`${maxPrice}`}
              />
            </div>
          </div>
          <div ref={trackRef} className="relative h-2 bg-surface rounded-full">
            <div
              className="absolute h-2 bg-primary rounded-full"
              style={{
                left: `${lowerPercent}%`,
                width: `${upperPercent - lowerPercent}%`,
              }}
            />
            <input
              ref={minRef}
              type="range"
              min={0}
              max={maxPrice}
              value={minSlider}
              onChange={handleMinSliderChange}
              className="absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
              style={{ zIndex: 3 }}
            />
            <input
              ref={maxRef}
              type="range"
              min={0}
              max={maxPrice}
              value={maxSlider}
              onChange={handleMaxSliderChange}
              className="absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
              style={{ zIndex: 5 }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Brand</h3>
        <input
          type="text"
          placeholder="Search brands..."
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {isLoadingBrands ? (
             <div className="space-y-2">
               {Array.from({ length: 6 }).map((_, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                   <Skeleton width="16px" height="16px" rounded />
                   <Skeleton width="70%" height="14px" rounded />
                 </div>
               ))}
             </div>
           ) : filteredBrands.length === 0 ? (
             <p className="text-sm text-muted">No brands found</p>
           ) : (
             filteredBrands.map((brand) => (
               <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
                 <input
                   type="checkbox"
                   checked={(filters.brands || []).includes(brand.slug)}
                   onChange={() => handleBrandToggle(brand.slug)}
                   className="h-4 w-4 rounded border border-default bg-surface-card text-primary focus:ring-primary/20"
                 />
                 <span className="text-sm text-primary group-hover:text-primary/80 transition-colors">
                   {brand.name}
                 </span>
               </label>
             ))
           )}
          </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Rating</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="rating-filter"
              checked={filters.minRating === undefined}
              onChange={() => handleRatingChange(undefined)}
              className="h-4 w-4 rounded border border-default bg-surface-card text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-primary group-hover:text-primary/80 transition-colors">
              Any
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="rating-filter"
              checked={filters.minRating === 4}
              onChange={() => handleRatingChange(4)}
              className="h-4 w-4 rounded border border-default bg-surface-card text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-primary group-hover:text-primary/80 transition-colors">
              4★ &amp; up
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="rating-filter"
              checked={filters.minRating === 3}
              onChange={() => handleRatingChange(3)}
              className="h-4 w-4 rounded border border-default bg-surface-card text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-primary group-hover:text-primary/80 transition-colors">
              3★ &amp; up
            </span>
          </label>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;