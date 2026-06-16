import { AlertCircle } from "lucide-react";
import EmptyState from "./EmptyState";

const ErrorState = ({ 
  title = "Something went wrong",
  message = "An error occurred while loading data. Please try again.",
  onRetry,
  retryLabel = "Try Again"
}) => {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={message}
      actionLabel={retryLabel}
      onAction={onRetry}
    />
  );
};

export default ErrorState;