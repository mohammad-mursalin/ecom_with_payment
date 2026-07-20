import { MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useChat } from "../Context/ChatContext";
import React from "react";

export default React.forwardRef(function ChatButton(props, ref) {
  const { toggleChat, isOpen } = useChat();

  return (
    <motion.button
      ref={ref}
      onClick={toggleChat}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary-hover transition-colors transition-shadow duration-[180ms] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 200, mass: 0.8 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.95, transition: { duration: 0.08 } }}
    >
      <div className="relative flex items-center justify-center">
        <MessageCircle className="w-6 h-6" />
        <Sparkles className="w-[14px] h-[14px] absolute -top-2 left-4" />
      </div>
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden md:block md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200 md:delay-[500ms] bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none">
        Ask Shopping Assistant
      </span>
    </motion.button>
  );
});
