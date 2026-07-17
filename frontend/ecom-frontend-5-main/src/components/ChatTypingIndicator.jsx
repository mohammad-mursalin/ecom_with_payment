export default function ChatTypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-white font-semibold">AI</span>
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-default bg-surface-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}