import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { sendMessage as sendMessageService } from "../services/chatService";
import { performRefresh } from "../refreshCoordinator";
import { getAccessToken } from "../authStorage";
import { jwtDecode } from "jwt-decode";

const ChatContext = createContext(null);

const SESSION_TOKEN_KEY = "chat_session_token";
const MESSAGES_KEY = "chat_messages";
const IS_OPEN_KEY = "chat_is_open";

function readSessionToken() {
  try {
    const raw = sessionStorage.getItem(SESSION_TOKEN_KEY);
    return raw || null;
  } catch {
    return null;
  }
}

function readMessages() {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function readIsOpen() {
  try {
    const raw = sessionStorage.getItem(IS_OPEN_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "[]";
  }
}

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const exp = decoded.exp;
    if (!exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= exp - 30;
  } catch {
    return true;
  }
}

function buildPageContext(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { pageType: "HOME", entityId: null };
  }
  const [first, second] = segments;
  if (first === "products") {
    if (second && !["new"].includes(second)) {
      return { pageType: "PRODUCT_DETAIL", entityId: second };
    }
    return { pageType: "CATEGORY_LISTING", entityId: null };
  }
  if (first === "cart") {
    return { pageType: "CART", entityId: null };
  }
  if (first === "checkout") {
    return { pageType: "CHECKOUT", entityId: null };
  }
  if (first === "orders") {
    if (second) {
      return { pageType: "ORDER_DETAIL", entityId: second };
    }
    return { pageType: "OTHER", entityId: null };
  }
  return { pageType: "OTHER", entityId: null };
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState(() => readMessages());
  const [sessionToken, setSessionToken] = useState(() => readSessionToken());
  const [isOpen, setIsOpen] = useState(() => readIsOpen());
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      sessionStorage.setItem(MESSAGES_KEY, safeJsonStringify(messages));
    } catch {
      // sessionStorage may be unavailable in some environments
    }
  }, [messages]);

  useEffect(() => {
    try {
      if (sessionToken) {
        sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      } else {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
      }
    } catch {
      // ignore
    }
  }, [sessionToken]);

  useEffect(() => {
    try {
      sessionStorage.setItem(IS_OPEN_KEY, String(isOpen));
    } catch {
      // ignore
    }
  }, [isOpen]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const sendMessage = useCallback(
    async (text) => {
      const userMessage = {
        id: crypto.randomUUID(),
        role: "USER",
        content: text,
        status: "sending",
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      let accessToken = getAccessToken();
      if (isTokenExpired(accessToken)) {
        try {
          const refreshed = await performRefresh();
          if (refreshed?.accessToken) {
            accessToken = refreshed.accessToken;
          }
        } catch {
          // proceed without token
        }
      }

      const pageContext = buildPageContext(location.pathname);

      try {
        const response = await sendMessageService({
          message: text,
          sessionToken,
          pageContext,
        });

        setSessionToken(response.sessionToken || sessionToken);

        const assistantMessage = {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: response.text,
          ...(response.structuredData ? { structuredData: response.structuredData } : {}),
          ...(response.suggestedActions ? { suggestedActions: response.suggestedActions } : {}),
        };

        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: "sent" } : msg
          );
          return [...updated, assistantMessage];
        });
      } catch (error) {
        const isNetworkError =
          !error.response ||
          error.code === "ECONNABORTED" ||
          error.code === "ENOTFOUND" ||
          error.code === "ECONNREFUSED" ||
          error.message === "Network Error";

        if (isNetworkError) {
          window.dispatchEvent(
            new CustomEvent("chat:connectivity-error", {
              detail: { message: "Unable to connect. Please check your network and try again." },
            })
          );
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: "failed" } : msg
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [sessionToken, location.pathname]
  );

  const retryMessage = useCallback(
    async (id) => {
      const target = messages.find((msg) => msg.id === id);
      if (!target || target.role !== "USER") return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, status: "sending" } : msg
        )
      );
      setLoading(true);

      let accessToken = getAccessToken();
      if (isTokenExpired(accessToken)) {
        try {
          const refreshed = await performRefresh();
          if (refreshed?.accessToken) {
            accessToken = refreshed.accessToken;
          }
        } catch {
          // proceed without token
        }
      }

      const pageContext = buildPageContext(location.pathname);

      try {
        const response = await sendMessageService({
          message: target.content,
          sessionToken,
          pageContext,
        });

        setSessionToken(response.sessionToken || sessionToken);

        const assistantMessage = {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: response.text,
          ...(response.structuredData ? { structuredData: response.structuredData } : {}),
          ...(response.suggestedActions ? { suggestedActions: response.suggestedActions } : {}),
        };

        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === id ? { ...msg, status: "sent" } : msg
          );
          return [...updated, assistantMessage];
        });
      } catch (error) {
        const isNetworkError =
          !error.response ||
          error.code === "ECONNABORTED" ||
          error.code === "ENOTFOUND" ||
          error.code === "ECONNREFUSED" ||
          error.message === "Network Error";

        if (isNetworkError) {
          window.dispatchEvent(
            new CustomEvent("chat:connectivity-error", {
              detail: { message: "Unable to connect. Please check your network and try again." },
            })
          );
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id ? { ...msg, status: "failed" } : msg
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [messages, sessionToken, location.pathname]
  );

  const value = {
    messages,
    sessionToken,
    isOpen,
    loading,
    sendMessage,
    openChat,
    closeChat,
    toggleChat,
    retryMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
