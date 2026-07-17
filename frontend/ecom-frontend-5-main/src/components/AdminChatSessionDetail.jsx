import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { getChatSessionDetail } from "../services/adminChatService";
import AdminChatTranscript from "../components/AdminChatTranscript";
import { ArrowLeft, AlertTriangle, User, Calendar, Clock } from "lucide-react";
import ErrorState from "../components/ErrorState";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminChatSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getChatSessionDetail(id);
      setSession(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load session detail";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-surface-elevated" />
          <div className="h-6 w-48 animate-pulse rounded bg-surface-elevated" />
        </div>
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-surface-elevated" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/admin/chat")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </button>
        <ErrorState
          title="Failed to load session"
          message={error || "Session not found"}
          onRetry={fetchDetail}
        />
      </div>
    );
  }

  const statusColor =
    session.status === "active"
      ? { bg: "var(--color-success)", text: "#ffffff" }
      : { bg: "var(--color-border)", text: "var(--text-primary)" };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/admin/chat")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sessions
      </button>

      <div className="rounded-2xl border border-default bg-surface-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {(session.username || "G").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary">
                {session.username || "Guest"}
              </h1>
              <span
                className="mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: statusColor.bg,
                  color: statusColor.text,
                }}
              >
                {session.status || "unknown"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-secondary">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted" />
              <span>Session #{session.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted" />
              <span>Created {formatDate(session.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted" />
              <span>Expires {formatDate(session.expiresAt)}</span>
            </div>
          </div>
        </div>

        {session.messages?.some((m) => m.isEscalation) && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning/10 px-4 py-2.5 text-sm text-warning">
            <AlertTriangle className="h-4 w-4" />
            This session contains escalated messages.
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Transcript
          </h2>
          <AdminChatTranscript messages={session.messages} />
        </div>
      </div>
    </div>
  );
}

export default AdminChatSessionDetail;
