import EmptyState from "./EmptyState";
import { Package } from "lucide-react";

const NotFound = () => {
  return (
    <EmptyState
      icon={Package}
      title="Page not found"
      description="The page you're looking for doesn't exist."
      actionLabel="Go Home"
      actionHref="/"
    />
  );
};

export default NotFound;
