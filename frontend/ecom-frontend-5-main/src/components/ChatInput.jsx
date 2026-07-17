import { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { useChat } from "../Context/ChatContext";

export default function ChatInput() {
  const { sendMessage, loading } = useChat();
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = textareaRef.current?.value?.trim();
    if (!text || loading) return;
    sendMessage(text);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 px-4 py-3 border-t border-default">
      <textarea
        ref={textareaRef}
        rows={1}
        onKeyDown={handleKeyDown}
        onInput={adjustHeight}
        placeholder="Ask me anything about products, your order, or your account..."
        disabled={loading}
        className="flex-1 resize-none rounded-xl border border-default bg-background px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 overflow-y-auto"
        style={{ maxHeight: "120px" }}
      />
      <button
        type="submit"
        aria-label="Send message"
        disabled={loading}
        className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50 flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}