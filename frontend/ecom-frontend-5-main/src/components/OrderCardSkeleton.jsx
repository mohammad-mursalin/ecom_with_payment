import Skeleton from "./Skeleton";

const OrderCardSkeleton = () => (
  <div className="rounded-2xl bg-surface-card border-surface-elevated border p-4 space-y-3 animate-pulse">
    <Skeleton width="30%" height="16px" rounded />
    <Skeleton width="20%" height="14px" rounded />
  </div>
);

export default OrderCardSkeleton;
