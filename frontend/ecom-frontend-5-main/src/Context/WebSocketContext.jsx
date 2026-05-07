import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../Context/AuthContext";

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState([]);
  const [paymentUpdates, setPaymentUpdates] = useState([]);

  useEffect(() => {
    // Build SockJS URL with JWT token as query parameter
    const socketUrl = token
      ? `http://localhost:8080/ws?token=${encodeURIComponent(token)}`
      : "http://localhost:8080/ws";

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("WebSocket connected");
        setConnected(true);

        // Subscribe to order updates
        stompClient.subscribe("/topic/orders", (message) => {
          const order = JSON.parse(message.body);
          setOrderUpdates((prev) => [...prev, order]);
        });

        // Subscribe to payment updates
        stompClient.subscribe("/topic/payments", (message) => {
          const payment = JSON.parse(message.body);
          setPaymentUpdates((prev) => [...prev, payment]);
        });
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected");
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
      },
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [token]);

  const subscribeToOrder = useCallback((orderId, callback) => {
    if (!client || !connected) return;
    
    const subscription = client.subscribe(`/topic/orders/${orderId}`, (message) => {
      const order = JSON.parse(message.body);
      callback(order);
    });

    return () => subscription.unsubscribe();
  }, [client, connected]);

  const subscribeToPayment = useCallback((orderId, callback) => {
    if (!client || !connected) return;
    
    const subscription = client.subscribe(`/topic/payments/${orderId}`, (message) => {
      const payment = JSON.parse(message.body);
      callback(payment);
    });

    return () => subscription.unsubscribe();
  }, [client, connected]);

  const clearOrderUpdates = useCallback(() => {
    setOrderUpdates([]);
  }, []);

  const clearPaymentUpdates = useCallback(() => {
    setPaymentUpdates([]);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        orderUpdates,
        paymentUpdates,
        subscribeToOrder,
        subscribeToPayment,
        clearOrderUpdates,
        clearPaymentUpdates,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;