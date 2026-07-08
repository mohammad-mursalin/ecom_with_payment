import Skeleton from "./Skeleton";

const StatCardSkeleton = () => (
  <div className="rounded-2xl bg-surface-card border-surface-elevated border p-5 animate-pulse">
    <Skeleton width="40px" height="40px" variant="circle" />
    <Skeleton width="64px" height="20px" rounded />
  </div>
);

export default StatCardSkeleton;
