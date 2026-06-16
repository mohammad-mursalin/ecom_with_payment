import Skeleton from "./Skeleton";

const StatCardSkeleton = () => (
  <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
    <div className="flex items-center justify-between">
      <Skeleton width="40px" height="40px" variant="circle" />
      <Skeleton width="64px" height="20px" rounded />
    </div>
    <div className="mt-4">
      <Skeleton width="50%" height="14px" rounded />
    </div>
    <div className="mt-2">
      <Skeleton width="40%" height="32px" rounded />
    </div>
    <div className="mt-2">
      <Skeleton width="30%" height="14px" rounded />
    </div>
  </div>
);

export default StatCardSkeleton;
