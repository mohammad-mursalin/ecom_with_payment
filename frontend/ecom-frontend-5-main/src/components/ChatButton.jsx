import { MessageCircle } from "lucide-react";
import { useChat } from "../Context/ChatContext";

export default function ChatButton({ ref: buttonRef }) {
  const { toggleChat, isOpen } = useChat();

  return (
    <button
      ref={buttonRef}
      onClick={toggleChat}
      aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover transition-colors flex items-center justify-center md:bottom-6 md:right-6"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
