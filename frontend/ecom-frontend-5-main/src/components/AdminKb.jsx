import { useState, useEffect, useCallback } from "react";
import { useToast } from "../components/Toast";
import { getKbArticles, updateKbArticle } from "../services/adminKbService";
import { Save } from "lucide-react";
import ErrorState from "../components/ErrorState";

const TOPIC_LABELS = {
  RETURNS: "Returns",
  SHIPPING: "Shipping",
  PAYMENT: "Payment",
  ACCOUNT: "Account",
  STORE_INFO: "Store Info",
  OTHER: "Other",
};

const TOPIC_ORDER = ["RETURNS", "SHIPPING", "PAYMENT", "ACCOUNT", "STORE_INFO", "OTHER"];

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminKb() {
  const { toast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingTopic, setSavingTopic] = useState(null);
  const [saveErrors, setSaveErrors] = useState({});

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getKbArticles();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load knowledge base articles";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSave = async (topic) => {
    const article = articles.find((a) => a.topic === topic);
    if (!article) return;

    const content = article.content || "";
    if (content.length > 2000) {
      setSaveErrors((prev) => ({ ...prev, [topic]: "Content must not exceed 2000 characters" }));
      return;
    }

    setSavingTopic(topic);
    setSaveErrors((prev) => {
      const next = { ...prev };
      delete next[topic];
      return next;
    });

    try {
      await updateKbArticle(topic, content);
      toast.success("Saved — this update is live immediately.");
      await fetchArticles();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to save";
      setSaveErrors((prev) => ({ ...prev, [topic]: msg }));
      toast.error(msg);
    } finally {
      setSavingTopic(null);
    }
  };

  const handleContentChange = (topic, value) => {
    setArticles((prev) =>
      prev.map((a) => (a.topic === topic ? { ...a, content: value } : a))
    );
    setSaveErrors((prev) => {
      const next = { ...prev };
      delete next[topic];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-primary">Knowledge Base</h2>
          <p className="text-sm text-muted">Loading articles...</p>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-default bg-surface-card p-5 space-y-3">
            <div className="h-5 w-32 rounded bg-surface-elevated animate-pulse" />
            <div className="h-24 w-full rounded bg-surface-elevated animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <ErrorState
          title="Failed to load knowledge base"
          message={error}
          onRetry={fetchArticles}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-primary">Knowledge Base</h2>
        <p className="text-sm text-muted">
          Manage the content the assistant uses when answering policy questions.
        </p>
      </div>

      <div className="space-y-4">
        {TOPIC_ORDER.map((topic) => {
          const article = articles.find((a) => a.topic === topic);
          const content = article?.content || "";
          const updatedAt = article?.updatedAt || null;
          const isSaving = savingTopic === topic;
          const saveError = saveErrors[topic];
          const charCount = content.length;
          const isOverLimit = charCount > 2000;

          return (
            <div
              key={topic}
              className="rounded-2xl border border-default bg-surface-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted">
                  {TOPIC_LABELS[topic] || topic}
                </label>
                <span
                  className={`text-xs font-medium ${
                    isOverLimit ? "text-danger" : charCount > 1800 ? "text-warning" : "text-muted"
                  }`}
                >
                  {charCount}/2000
                </span>
              </div>

              <textarea
                value={content}
                onChange={(e) => handleContentChange(topic, e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-default bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={`Enter ${TOPIC_LABELS[topic] || topic} content...`}
              />

              {content === "" && (
                <p className="text-xs text-warning">
                  Leaving this empty means the assistant won&apos;t have information on this topic.
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">
                  {updatedAt ? `Last updated: ${formatDate(updatedAt)}` : "Never edited"}
                </div>
                <div className="flex items-center gap-2">
                  {saveError && (
                    <span className="text-xs text-danger">{saveError}</span>
                  )}
                  <button
                    onClick={() => handleSave(topic)}
                    disabled={isSaving || isOverLimit}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                  >
                    {isSaving ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminKb;
