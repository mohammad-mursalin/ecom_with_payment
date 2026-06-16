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
  if (!actionLabel) {
    return (
      <div className="empty-state">
        <Icon className="empty-state-icon text-blue-600" />
        <h2 className="empty-state-title">{title}</h2>
        <p className="empty-state-description">{description}</p>
      </div>
    );
  }

  return onAction ? (
    <div className="empty-state">
      <Icon className="empty-state-icon text-blue-600" />
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-description">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="btn btn-modern btn-modern-primary"
      >
        {actionLabel}
      </button>
    </div>
  ) : (
    <div className="empty-state">
      <Icon className="empty-state-icon text-blue-600" />
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-description">{description}</p>
      <Link to={actionHref} className="btn btn-modern btn-modern-primary">
        {actionLabel}
      </Link>
    </div>
  );
};

export default EmptyState;