import { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatTypingIndicator from "./ChatTypingIndicator";

const WELCOME_TEXT =
  "Hi! I can help you find products, check on an order, or answer questions about shopping here. What can I help with?";

export default function ChatMessageList({ messages, loading }) {
  const bottomRef = useRef(null);
  const isEmpty = messages.length === 0 && !loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      aria-live="polite"
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
    >
      {isEmpty && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-white font-semibold">AI</span>
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-default bg-surface-card px-4 py-3 text-sm text-primary shadow-sm">
            <p>{WELCOME_TEXT}</p>
          </div>
        </div>
      )}
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {loading && <ChatTypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}