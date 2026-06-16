import Skeleton from "./Skeleton";

const OrderCardSkeleton = () => (
  <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
    <div className="flex items-center justify-between">
      <Skeleton width="30%" height="16px" rounded />
      <Skeleton width="20%" height="14px" rounded />
    </div>
    <Skeleton width="60%" height="14px" rounded />
    <div className="flex items-center justify-between pt-2">
      <Skeleton width="25%" height="20px" rounded />
      <Skeleton width="80px" height="24px" rounded />
    </div>
  </div>
);

export default OrderCardSkeleton;
