import Skeleton from "./Skeleton";

const CategoryCardSkeleton = () => (
  <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
    <div className="flex justify-center">
      <Skeleton width="40px" height="40px" variant="circle" />
    </div>
    <div className="mt-3 mx-auto">
      <Skeleton width="60%" height="18px" rounded />
    </div>
    <div className="mt-2 mx-auto">
      <Skeleton width="80%" height="14px" rounded />
    </div>
  </div>
);

export default CategoryCardSkeleton;
