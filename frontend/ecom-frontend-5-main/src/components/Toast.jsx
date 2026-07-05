import { createContext, useContext, useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const MAX_VISIBLE = 4;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);
  const containerRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = ++idCounter.current;
    const autoHideDelay = type === "error" ? 6000 : 4000;

    const newToast = {
      id,
      message,
      type,
      show: true,
      autoHideDelay,
    };

    setToasts((prev) => {
      const next = [...prev, newToast];
      return next.slice(-MAX_VISIBLE);
    });

    return id;
  }, []);

  const toast = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    info: (msg) => showToast(msg, "info"),
    warning: (msg) => showToast(msg, "warning"),
  };

  const bgMap = {
    success: "bg-success",
    error: "bg-danger",
    info: "bg-info",
    warning: "bg-warning",
  };

  const textMap = {
    success: "text-success",
    error: "text-danger",
    info: "text-info",
    warning: "text-warning",
  };

  const bgClassMap = {
    success: "bg-success/10",
    error: "bg-danger/10",
    info: "bg-info/10",
    warning: "bg-warning/10",
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let timeoutId = null;

    const autoHideToast = (id, delay) => {
      timeoutId = setTimeout(() => {
        removeToast(id);
      }, delay);
    };

    toasts.forEach((toast) => {
      if (toast.autoHideDelay && toast.show) {
        autoHideToast(toast.id, toast.autoHideDelay);
      }
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        ref={containerRef}
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative flex items-start gap-3 p-4 rounded-lg border border-default bg-surface-elevated shadow-xl"
            >
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${bgClassMap[t.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-colors"
                aria-label="Close toast"
              >
                <svg
                  className="w-4 h-4 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
