import Skeleton from "./Skeleton";

const ProductDetailSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
    <div className="space-y-4">
      <Skeleton height="520px" width="100%" rounded="8px" />
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} height="64px" width="80px" rounded="4px" />
        ))}
      </div>
    </div>
    <div className="space-y-5">
      <div>
        <Skeleton width="30%" height="14px" rounded />
        <Skeleton width="70%" height="32px" rounded className="mt-2" />
        <Skeleton width="50%" height="16px" rounded className="mt-2" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton width="120px" height="36px" rounded />
        <Skeleton width="80px" height="24px" rounded />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton width="100px" height="28px" rounded />
        <Skeleton width="90px" height="24px" rounded />
      </div>
      <Skeleton height="40px" width="100%" rounded />
      <div className="flex gap-3">
        <Skeleton height="48px" width="100%" rounded />
        <Skeleton height="48px" width="100%" rounded />
      </div>
      <Skeleton width="160px" height="40px" rounded />
    </div>
  </div>
);

export default ProductDetailSkeleton;
