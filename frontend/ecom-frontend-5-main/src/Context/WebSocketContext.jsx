import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./AuthContext";
import { getAccessToken } from "../authStorage";

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());

useEffect(() => {
    if (!isAuthenticated) {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
      subscriptionsRef.current.clear();
      setConnected(false);
      return;
    }

    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL;
    const subs = subscriptionsRef.current;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws?token=${getAccessToken()}`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        subs.forEach((callback, topic) => {
          client.subscribe(topic, callback);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        if (import.meta.env.DEV) console.warn('STOMP error', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      const c = clientRef.current;
      if (c) {
        c.deactivate();
      }
      subs.clear();
    };
  }, [isAuthenticated]);

  const subscribe = useCallback((topic, callback) => {
    if (!clientRef.current || !connected) return () => {};

    const subscription = clientRef.current.subscribe(topic, callback);
    const id = `${topic}-${Date.now()}`;
    subscriptionsRef.current.set(id, callback);

    return () => {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(id);
    };
  }, [connected]);

  const unsubscribe = useCallback((subscriptionId) => {
    subscriptionsRef.current.delete(subscriptionId);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;