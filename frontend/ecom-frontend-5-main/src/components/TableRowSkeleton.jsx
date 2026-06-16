import Skeleton from "./Skeleton";

const TableRowSkeleton = ({ columns = 5 }) => {
  const widths = ["10%", "25%", "20%", "20%", "15%", "10%"];
  return (
    <tr>
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="py-3 pr-4">
          <Skeleton width={widths[idx] || "20%"} height="14px" rounded />
        </td>
      ))}
    </tr>
  );
};

TableRowSkeleton.propTypes = {
  columns: Number,
};

export default TableRowSkeleton;
