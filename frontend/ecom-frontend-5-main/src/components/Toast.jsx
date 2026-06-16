import { createContext, useContext, useCallback, useRef, useState } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

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
    success: "success",
    error: "danger",
    info: "info",
    warning: "warning",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer
        position="bottom-end"
        className="p-3"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            show={t.show}
            onClose={() => removeToast(t.id)}
            bg={bgMap[t.type]}
            autohide
            delay={t.autoHideDelay}
          >
            <Toast.Header>
              <strong className="me-auto">
                {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
              </strong>
            </Toast.Header>
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};