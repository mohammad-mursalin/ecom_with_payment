import { AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';

function getFeedbackIcon(rating) {
  if (rating === 'HELPFUL') return <ThumbsUp className="h-3.5 w-3.5 text-success" />;
  if (rating === 'NOT_HELPFUL') return <ThumbsDown className="h-3.5 w-3.5 text-danger" />;
  return null;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AdminChatTranscript({ messages }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="rounded-2xl border border-default bg-surface-card p-8 text-center text-muted">
        No messages in this session.
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto rounded-2xl border border-default bg-surface-card p-4">
      {messages.map((msg) => {
        const isUser = msg.role === 'USER';
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!isUser && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                AI
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? 'rounded-tr-sm bg-primary text-white' : 'rounded-tl-sm border border-default bg-surface-card text-primary'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
                <span>{formatDateTime(msg.createdAt)}</span>
                {msg.isEscalation && (
                  <span className="inline-flex items-center gap-1 text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    Escalated
                  </span>
                )}
                {!isUser && msg.feedback && (
                  <span className="inline-flex items-center gap-1">
                    {getFeedbackIcon(msg.feedback.rating)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdminChatTranscript;
