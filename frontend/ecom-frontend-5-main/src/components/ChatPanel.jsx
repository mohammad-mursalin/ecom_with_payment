import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useChat } from "../Context/ChatContext";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";

export default function ChatPanel({ buttonRef }) {
  const { isOpen, closeChat, messages, loading } = useChat();
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [hasFocus, setHasFocus] = useState(false);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (hasFocus) {
          closeChat();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeChat, hasFocus]);

  const handleClose = () => {
    closeChat();
    buttonRef.current?.focus();
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Chat assistant"
      tabIndex={0}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
      className="fixed inset-0 z-50 flex flex-col bg-surface md:inset-auto md:bottom-24 md:right-4 md:w-[380px] md:max-h-[600px] md:rounded-2xl md:border md:border-default md:shadow-2xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-default flex-shrink-0">
        <h2 className="text-sm font-semibold text-primary">
          Mursalin Assistant
        </h2>
        <button
          ref={closeBtnRef}
          onClick={handleClose}
          aria-label="Close chat"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-colors"
        >
          <X className="w-4 h-4 text-secondary" />
        </button>
      </div>

      <ChatMessageList messages={messages} loading={loading} />
      <ChatInput />
    </div>
  );
}