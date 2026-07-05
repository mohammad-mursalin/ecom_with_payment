import EmptyState from "./EmptyState";
import { SearchX } from "lucide-react";

const NotFound = () => {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="The page you're looking for doesn't exist."
      actionLabel="Go Home"
      actionHref="/"
    />
  );
};

export default NotFound;
