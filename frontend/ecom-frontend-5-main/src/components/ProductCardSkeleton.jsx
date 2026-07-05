import Skeleton from "./Skeleton";

const ProductCardSkeleton = () => (
  <div className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm dark:shadow-none">
    <Skeleton height="200px" width="100%" rounded="0" />
    <div className="space-y-3 mt-6">
      <Skeleton width="40%" height="12px" rounded />
      <Skeleton width="90%" height="20px" rounded />
      <Skeleton width="70%" height="18px" rounded />
      <Skeleton width="50%" height="14px" rounded />
      <Skeleton width="35%" height="22px" rounded />
      <Skeleton width="100%" height="40px" rounded />
    </div>
  </div>
);

export default ProductCardSkeleton;
