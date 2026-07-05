import { Link } from "react-router-dom";
import { Package } from "lucide-react";

const EmptyState = ({
  icon: Icon = Package,
  title = "Nothing found",
  description = "There is nothing to display here.",
  actionLabel,
  actionHref = "/",
  onAction
}) => {
  const Button = onAction ? 'button' : Link;

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <Icon className="h-16 w-16 text-muted" />
      <h2 className="mt-4 text-lg font-semibold text-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>
      {actionLabel && (
        <div className="mt-6">
          <Button
            type={onAction ? 'button' : undefined}
            to={onAction ? undefined : actionHref}
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;