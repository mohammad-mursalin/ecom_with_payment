import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

const MODAL_Z_INDEX = 9999;

export function ChatComparisonModal({ items, onClose, triggerRef }) {
  const overlayRef = useRef(null);
  const closeBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    closeBtnRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        trapFocus(e);
      }
    };

    function trapFocus(e) {
      const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
      const focusable = Array.from(overlayRef.current?.querySelectorAll(focusableSelector) || []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !overlayRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !overlayRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const allSpecKeys = new Set();
    items.forEach((item) => {
      if (!item.error && item.specs) {
        item.specs.forEach((s) => allSpecKeys.add(s.specKey));
      }
    });
  }, [items]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const handleClose = useCallback(() => {
    onClose();
    if (triggerRef?.current) {
      triggerRef.current.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [onClose, triggerRef]);

  const validItems = items?.filter((item) => !item.error) || [];

  const allSpecKeys = [];
  if (validItems.length > 0) {
    const keySet = new Set();
    validItems.forEach((item) => {
      item.specs?.forEach((s) => keySet.add(s.specKey));
    });
    allSpecKeys.push(...keySet);
  }

  const specMap = (item) => {
    if (!item.specs) return {};
    return item.specs.reduce((acc, s) => ({ ...acc, [s.specKey]: s.specValue }), {});
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 flex items-center justify-center p-4 md:p-8"
      style={{ zIndex: MODAL_Z_INDEX }}
      role="dialog"
      aria-modal="true"
      aria-label="Product comparison"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-surface-elevated border border-default rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <h2 className="text-base font-semibold text-text-primary">Product Comparison</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-card text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {items.length <= 0 ? (
            <p className="text-sm text-muted text-center py-8">No products to compare.</p>
          ) : (
            <div className="overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
              <table className="w-full border-collapse min-w-[400px]">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3 pr-4 w-32">
                      Feature
                    </th>
                    {items.map((item) => (
                      <th key={item.id} className="text-left pb-3 pl-4 min-w-[150px]">
                        {item.error ? (
                          <div className="flex flex-col items-center gap-2 py-3">
                             <span className="text-sm text-muted">Couldn&apos;t load this product</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <img
                              src={item.primaryImageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                              alt={item.name || "Product"}
                              loading="lazy"
                              className="w-12 h-12 rounded-lg object-cover bg-surface flex-shrink-0"
                            />
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">
                                {item.name}
                              </span>
                              <span className="text-sm font-bold text-primary">
                                ৳{Number(item.price || 0).toFixed(2)}
                              </span>
                              {item.averageRating && item.averageRating > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-warning text-xs">
                                  ★ {item.averageRating.toFixed(1)}
                                </span>
                              )}
                              {item.inStock === false && (
                                <span className="text-[11px] font-medium text-danger">Out of stock</span>
                              )}
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSpecKeys.length === 0 && (
                    <tr>
                      <td colSpan={items.length + 1} className="text-center text-sm text-muted py-6">
                        No specs available for comparison.
                      </td>
                    </tr>
                  )}
                  {allSpecKeys.map((key) => (
                    <tr key={key} className="border-t border-default">
                      <td className="text-xs font-medium text-text-secondary uppercase tracking-wider py-2.5 pr-4 align-top pt-3 capitalize">
                        {key}
                      </td>
                      {items.map((item) => {
                        const specs = specMap(item);
                        return (
                          <td key={item.id} className="text-sm text-text-primary py-2.5 pl-4 align-top">
                            {item.error ? (
                              <span className="text-muted">—</span>
                            ) : (
                              specs[key] || <span className="text-muted">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
