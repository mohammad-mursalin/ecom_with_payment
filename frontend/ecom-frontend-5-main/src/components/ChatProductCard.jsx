import { useState } from "react";
import { Star } from "lucide-react";

function ProductImage({ src, alt }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className="w-14 h-14 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] text-muted leading-tight text-center px-1">No image</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-surface"
      onError={() => setErr(true)}
    />
  );
}

function MiniStar({ rating }) {
  if (!rating || rating === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-warning">
      <Star className="w-3 h-3 fill-warning text-warning" />
      <span className="text-[11px] font-medium text-text-secondary">{rating.toFixed(1)}</span>
    </span>
  );
}

export function ChatProductCard({ item }) {
  if (!item) return null;

  const { name, price, primaryImageUrl, averageRating, inStock } = item;

  return (
    <div className="flex items-start gap-3 w-40 flex-shrink-0 bg-surface-card border border-default rounded-xl p-2.5 shadow-sm">
      <ProductImage src={primaryImageUrl} alt={name} />
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <p className="text-xs font-medium text-text-primary leading-snug line-clamp-2 break-words">
          {name}
        </p>
        <p className="text-sm font-semibold text-primary">
          ৳{Number(price || 0).toFixed(2)}
        </p>
        <MiniStar rating={averageRating} />
        {inStock === false && (
          <span className="text-[10px] font-medium text-danger">Out of stock</span>
        )}
      </div>
    </div>
  );
}

export function ChatProductCardRow({ items }) {
  if (!items || items.length === 0) return null;
  if (items.length === 1) {
    return (
      <div className="flex justify-start">
        <ChatProductCard item={items[0]} />
      </div>
    );
  }
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
         style={{ scrollbarWidth: "thin" }}>
      {items.map((item) => (
        <div key={item.id} className="snap-start">
          <ChatProductCard item={item} />
        </div>
      ))}
    </div>
  );
}
