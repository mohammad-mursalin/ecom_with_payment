import { ChevronRight } from "lucide-react";

export function ChatComparisonTable({ structuredData, onOpenModal, openModalBtnRef }) {
  const items = structuredData?.items || [];

  if (items.length === 0) return null;

  if (items.length === 2) {
    return (
      <div className="flex flex-col gap-3 mt-2">
        {items.map((item) => (
          <ErrorAwareCard key={item.id} item={item} showSpecs />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
           style={{ scrollbarWidth: "thin" }}>
        {items.map((item) => (
          <div key={item.id} className="snap-start">
            <CompactItem item={item} />
          </div>
        ))}
      </div>
      <button
        type="button"
        ref={openModalBtnRef}
        onClick={onOpenModal}
        className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
      >
        View Full Comparison
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CompactItem({ item }) {
  if (item.error) {
    return (
      <div className="w-40 flex-shrink-0 bg-surface-card border border-default rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-center">
        <span className="text-[11px] text-muted">Couldn&apos;t load this product</span>
      </div>
    );
  }
  const { name, price, primaryImageUrl } = item;
  return (
    <div className="flex items-center gap-2.5 w-40 flex-shrink-0 bg-surface-card border border-default rounded-xl p-2.5 shadow-sm">
      <img
        src={primaryImageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
        alt={name || "Product"}
        loading="lazy"
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-surface"
      />
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <p className="text-xs font-medium text-text-primary leading-snug line-clamp-2 break-words">{name}</p>
        <p className="text-xs font-semibold text-primary">৳{Number(price || 0).toFixed(2)}</p>
      </div>
    </div>
  );
}

function ErrorAwareCard({ item, showSpecs }) {
  if (item.error) {
    return (
      <div className="bg-surface-card border border-default rounded-xl p-4 flex items-center justify-center">
        <span className="text-sm text-muted">Couldn&apos;t load this product</span>
      </div>
    );
  }

  const { name, price, primaryImageUrl, averageRating, inStock, specs } = item;

  return (
    <div className="bg-surface-card border border-default rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <img
          src={primaryImageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
          alt={name || "Product"}
          loading="lazy"
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-surface"
        />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary leading-snug">{name}</p>
          <p className="text-sm font-bold text-primary">৳{Number(price || 0).toFixed(2)}</p>
          {averageRating && averageRating > 0 && (
            <span className="inline-flex items-center gap-0.5 text-warning text-xs">
              ★ {averageRating.toFixed(1)}
            </span>
          )}
          {inStock === false && (
            <span className="text-[11px] font-medium text-danger">Out of stock</span>
          )}
        </div>
      </div>
      {showSpecs && specs && specs.length > 0 && (
        <div className="mt-3 border-t border-default pt-2.5">
          {specs.map((spec) => (
            <div key={spec.specKey} className="flex text-xs py-1.5 border-b border-default last:border-b-0">
              <span className="text-text-secondary w-28 flex-shrink-0 capitalize">{spec.specKey}</span>
              <span className="text-text-primary font-medium">{spec.specValue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
