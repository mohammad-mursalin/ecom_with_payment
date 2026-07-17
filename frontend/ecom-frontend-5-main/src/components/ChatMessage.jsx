import { useChat } from "../Context/ChatContext";
import { ChatProductCardRow } from "./ChatProductCard";
import { ChatComparisonTable } from "./ChatComparisonTable";
import { ChatComparisonModal } from "./ChatComparisonModal";
import { ChatSuggestedActions } from "./ChatSuggestedActions";
import { useCallback, useState, useRef } from "react";

export default function ChatMessage({ message }) {
  const { retryMessage } = useChat();
  const isUser = message.role === "USER";

  const [modalOpen, setModalOpen] = useState(false);
  const openModalBtnRef = useRef(null);

  const handleRetry = () => {
    if (message.status === "failed") {
      retryMessage(message.id);
    }
  };

  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[80%]">
          <div
            className={`rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm ${
              message.status === "failed"
                ? "border border-danger bg-danger/10 text-primary"
                : "bg-primary text-white"
            }`}
          >
            <p>{message.content}</p>
          </div>
          {message.status === "failed" && (
            <button
              type="button"
              onClick={handleRetry}
              className="mt-1 text-xs text-danger hover:underline cursor-pointer text-right block"
            >
              Failed to send · Tap to retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const { structuredData, suggestedActions } = message;

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-white font-semibold">AI</span>
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-default bg-surface-card px-4 py-3 text-sm text-primary shadow-sm">
        <p className="whitespace-pre-wrap">{message.content}</p>

        {structuredData && structuredData.type === "PRODUCT_LIST" && (
          <ChatProductCardRow items={structuredData.items} />
        )}

        {structuredData && structuredData.type === "COMPARISON_TABLE" && (
          <ChatComparisonTable
            structuredData={structuredData}
            onOpenModal={handleOpenModal}
            openModalBtnRef={openModalBtnRef}
          />
        )}

        {suggestedActions && suggestedActions.length > 0 && (
          <ChatSuggestedActions actions={suggestedActions} />
        )}
      </div>

      {modalOpen && structuredData && structuredData.type === "COMPARISON_TABLE" && (
        <ChatComparisonModal
          items={structuredData.items}
          onClose={handleCloseModal}
          triggerRef={openModalBtnRef}
        />
      )}
    </div>
  );
}
