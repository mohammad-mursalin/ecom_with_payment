import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../components/Toast";
import Pagination from "../components/Pagination";
import { getReviews, getMyReview, checkEligibility, createReview, updateReview, voteReview, reportReview, deleteReview } from "../services/reviewService";
import { Star, Flag, Trash2, Pencil, Check, X } from "lucide-react";
import ErrorState from "./ErrorState";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

function StarDisplay({ rating, size = 16, interactive = false, onHover, onClick, selected = false }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(rating);
    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onClick?.(i)}
        onMouseEnter={() => interactive && onHover?.(i)}
        onMouseLeave={() => interactive && onHover?.(null)}
        className={`${interactive ? "cursor-pointer" : "cursor-default"} ${selected ? "text-warning" : ""}`}
      >
        <Star
          className={`${filled ? "fill-warning text-warning" : "text-muted"}`}
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      </button>
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function FractionalStarsDisplay({ rating, count, size = 16 }) {
  const fullStars = Math.floor(rating ?? 0);
  const decimal = (rating ?? 0) - fullStars;
  const emptyStars = 5 - fullStars - (decimal > 0 ? 1 : 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="fill-warning text-warning" style={{ width: `${size}px`, height: `${size}px` }} />
        ))}
        {decimal > 0 && (
          <span className="relative inline-flex">
            <Star className="text-muted" style={{ width: `${size}px`, height: `${size}px` }} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(decimal, 0) * 100}%` }}>
              <Star className="fill-warning text-warning" style={{ width: `${size}px`, height: `${size}px` }} />
            </span>
          </span>
        )}
        {[...Array(Math.max(0, emptyStars))].map((_, i) => (
          <Star key={`empty-${i}`} className="text-muted" style={{ width: `${size}px`, height: `${size}px` }} />
        ))}
      </div>
      <span className="text-sm text-muted">
        {count == null || Number(count) === 0 ? "No reviews yet" : `(${Number(count)} reviews)`}
      </span>
    </div>
  );
}

function ReviewSummaryBlock({ summary, onFilterByStars }) {
  if (!summary) return null;

  const { averageRating, totalCount, distribution } = summary;
  const displayRating = Math.round((averageRating || 0) * 10) / 10;

  return (
    <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-primary">{displayRating}</div>
          <div className="mt-2">
            <FractionalStarsDisplay rating={averageRating || 0} count={totalCount} size={20} />
          </div>
          <p className="text-sm text-muted mt-1">Based on {totalCount} reviews</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution?.[star] || 0;
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <button
                key={star}
                type="button"
                onClick={() => onFilterByStars?.(star)}
                className="w-full flex items-center gap-3 group"
              >
                <span className="text-sm font-medium text-primary w-6">{star}★</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden bg-surface-elevated">
                  <div
                    className="h-full rounded-full transition-all bg-primary"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted w-16 text-right">{count} reviews</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WriteReviewForm({ productId, onSubmitSuccess, isAuthenticated, hasPurchased, checkingEligibility, existingReview }) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const isEdit = !!existingReview;
  const maxTitle = 100;
  const minBody = 20;
  const maxBody = 2000;

  const canSubmit =
    rating > 0 &&
    title.trim().length <= maxTitle &&
    body.trim().length >= minBody &&
    body.trim().length <= maxBody &&
    !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        productId,
        orderId: existingReview?.orderId || 0,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      };

      if (isEdit) {
        await updateReview(existingReview.id, payload);
        toast.success("Review updated successfully");
      } else {
        await createReview(payload);
        toast.success("Review submitted!");
      }
      setExpanded(false);
      setRating(0);
      setTitle("");
      setBody("");
      onSubmitSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to submit review";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none text-center">
        <p className="text-muted">Please login to write a review</p>
      </div>
    );
  }

  if (!hasPurchased && !isEdit && !checkingEligibility) {
    return (
      <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none text-center">
        <p className="text-muted">You need to purchase this product to leave a review</p>
      </div>
    );
  }

  if (isEdit && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated"
      >
        <Pencil className="w-4 h-4" />
        Edit Review
      </button>
    );
  }

  if (!expanded && !isEdit) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
      >
        Write a Review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary">
          {isEdit ? "Edit Review" : "Write a Review"}
        </h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-muted hover:text-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-primary mb-2">Rating *</label>
        <div
          onMouseLeave={() => setHoverRating(0)}
          className="flex items-center gap-1"
        >
          <StarDisplay
            rating={hoverRating || rating}
            interactive
            onClick={(val) => setRating(val)}
            onHover={setHoverRating}
            selected={rating > 0}
          />
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted">{rating} / 5</span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-primary mb-1">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={maxTitle}
          placeholder="Summarize your experience"
          className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs mt-1 text-right text-muted">{title.length}/{maxTitle}</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-primary mb-1">Review *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minLength={minBody}
          maxLength={maxBody}
          rows={4}
          placeholder="Share your thoughts about this product..."
          className="w-full rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
        />
        <p className={`text-xs mt-1 text-right ${body.length < minBody ? "text-danger" : "text-muted"}`}>
          {body.length}/{maxBody} {body.length > 0 && body.length < minBody && `(min ${minBody})`}
        </p>
      </div>

      {error && <p className="text-sm mb-4 text-danger">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
        >
          {submitting ? "Submitting..." : isEdit ? "Update Review" : "Post Review"}
        </button>
      </div>
    </form>
  );
}

function ReviewCard({ review, currentUserId, onVote, onReport, onEdit, onDelete }) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const isOwner = currentUserId !== null && review.userId === currentUserId;

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      await onReport?.(review.id, reportReason.trim());
      setShowReportForm(false);
      setReportReason("");
    } catch {
      // handled in parent
    } finally {
      setReporting(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      await onVote?.(review.id, voteType);
    } catch {
      // handled in parent
    }
  };

  const dateStr = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: stringToColor(review.username || "U") }}
          >
            {review.userInitial || "?"}
          </div>
          <div>
            <p className="font-medium text-sm text-primary">{review.username}</p>
            <p className="text-xs text-muted">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <StarDisplay rating={review.rating} size={14} />
          <span className="text-xs text-muted">{review.rating}.0</span>
        </div>
      </div>

      {review.title && (
        <p className="font-semibold text-sm mb-2 text-primary">{review.title}</p>
      )}
      <p className="text-sm mb-3 whitespace-pre-line text-secondary">{review.body}</p>

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {review.images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt="Review"
              className="w-20 h-20 object-cover rounded-lg border border-default"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-default">
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => handleVote("HELPFUL")}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              review.userVote === "HELPFUL" ? "bg-success/10 text-success font-medium" : "text-muted"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Yes ({review.helpfulCount || 0})
          </button>
          <button
            type="button"
            onClick={() => handleVote("NOT_HELPFUL")}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              review.userVote === "NOT_HELPFUL" ? "bg-danger/10 text-danger font-medium" : "text-muted"
            }`}
          >
            <X className="w-3.5 h-3.5" />
            No ({review.notHelpfulCount || 0})
          </button>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setShowReportForm(!showReportForm)}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          Report
        </button>

        {isOwner && (
          <>
            <button
              type="button"
              onClick={() => onEdit?.(review)}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this review?")) {
                  onDelete?.(review.id);
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </>
        )}
      </div>

      {showReportForm && (
        <form onSubmit={handleReport} className="mt-3 flex gap-2">
          <input
            type="text"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Reason for reporting..."
            className="flex-1 rounded-lg border border-default bg-surface-card px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={reporting || !reportReason.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
          >
            {reporting ? "..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => setShowReportForm(false)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-default bg-surface-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-elevated"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#2563EB", "#7C3AED", "#DB2777", "#DC2626", "#EA580C",
    "#CA8A04", "#16A34A", "#0891B2", "#4F46E5", "#BE185D",
  ];
  return colors[Math.abs(hash) % colors.length];
}

const ReviewsSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState("newest");
  const [minRatingFilter, setMinRatingFilter] = useState(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, size: pageSize };
      if (sort) params.sort = sort;
      if (minRatingFilter) params.minRating = minRatingFilter;
      if (verifiedOnly) params.verifiedOnly = true;

      const data = await getReviews(productId, params);
      setReviews(data.content || []);
      setSummary(data.summary || null);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load reviews";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [productId, page, pageSize, sort, minRatingFilter, verifiedOnly, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (user && productId) {
      getMyReview(productId)
        .then((data) => setMyReview(data))
        .catch(() => setMyReview(null));
    } else {
      setMyReview(null);
    }
  }, [user, productId]);

  useEffect(() => {
    if (user && productId) {
      setCheckingEligibility(true);
      checkEligibility(productId)
        .then((data) => setHasPurchased(data))
        .catch(() => setHasPurchased(false))
        .finally(() => setCheckingEligibility(false));
    }
  }, [user, productId]);

  const handleVote = async (reviewId, voteType) => {
    try {
      await voteReview(reviewId, voteType);
      await fetchReviews();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to vote";
      toast.error(msg);
    }
  };

  const handleReport = async (reviewId, reason) => {
    try {
      await reportReview(reviewId, reason);
      toast.success("Review reported");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to report";
      toast.error(msg);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      toast.success("Review deleted");
      setMyReview(null);
      await fetchReviews();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to delete";
      toast.error(msg);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
  };

  const handleWriteSuccess = async () => {
    setEditingReview(null);
    setMyReview(null);
    await fetchReviews();
  };

  const handleFilterByStars = (star) => {
    setMinRatingFilter((prev) => (prev === star ? null : star));
    setPage(0);
  };

  const totalPages = summary ? Math.ceil((summary.totalCount || 0) / pageSize) : 0;

  return (
    <div>
      <ReviewSummaryBlock summary={summary} onFilterByStars={handleFilterByStars} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer text-primary">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => {
                setVerifiedOnly(e.target.checked);
                setPage(0);
              }}
              className="accent-primary"
            />
            Verified purchases only
          </label>
        </div>

        <WriteReviewForm
          productId={productId}
          onSubmitSuccess={handleWriteSuccess}
          isAuthenticated={!!user}
          hasPurchased={hasPurchased}
          checkingEligibility={checkingEligibility}
          existingReview={editingReview || myReview}
        />

        {minRatingFilter !== null && (
          <button
            type="button"
            onClick={() => {
              setMinRatingFilter(null);
              setPage(0);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary"
          >
            {minRatingFilter}★ only <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-elevated animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 rounded w-32 bg-surface-elevated animate-pulse" />
                  <div className="h-3 rounded w-24 bg-surface-elevated animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 rounded w-3/4 bg-surface-elevated animate-pulse" />
                <div className="h-4 rounded w-full bg-surface-elevated animate-pulse" />
                <div className="h-4 rounded w-5/6 bg-surface-elevated animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="max-w-2xl mx-auto">
          <ErrorState
            title="Failed to load reviews"
            message={error}
            onRetry={fetchReviews}
          />
        </div>
      ) : reviews.length === 0 ? (
       <div className="flex flex-col items-center justify-center text-center py-12">
         <Star className="w-16 h-16 text-primary mb-4" />
         <h2 className="text-2xl font-bold text-primary mb-2">No reviews yet</h2>
         <p className="text-base text-secondary mb-6 max-w-md">
           Be the first to share your experience with this product.
         </p>
       </div>
     ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <p className="text-sm text-muted">
               Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, summary?.totalCount || 0)} of {summary?.totalCount || 0} reviews
             </p>
             <select
               value={sort}
               onChange={(e) => {
                 setSort(e.target.value);
                 setPage(0);
               }}
               className="rounded-lg border border-default bg-surface-card px-3 py-1.5 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
             >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.userId || user?.id || null}
              onVote={handleVote}
              onReport={handleReport}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={summary?.totalCount || 0}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(0);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;