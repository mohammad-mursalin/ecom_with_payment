import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 12;

export function usePagination() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(
    DEFAULT_PAGE,
    parseInt(searchParams.get("page") ?? `${DEFAULT_PAGE}`, 10) || DEFAULT_PAGE
  );

  const pageSizeRaw = parseInt(
    searchParams.get("pageSize") ?? `${DEFAULT_PAGE_SIZE}`,
    10
  );
  const pageSize = [12, 24, 48].includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_PAGE_SIZE;

  const setPage = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next <= 0) {
            updated.delete("page");
          } else {
            updated.set("page", String(next));
          }
          return updated;
        },
        { replace: true }
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams]
  );

  const setPageSize = useCallback(
    (size) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set("pageSize", String(size));
          return updated;
        },
        { replace: true }
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams]
  );

  return { page, pageSize, setPage, setPageSize };
}
