import React from "react";
import Button from "../Button/Button.jsx";
import "./Pagination.styles.scss";

const getVisiblePages = (currentPage, totalPages, maxVisible) => {
  const pages = [];
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("start-ellipsis");
  }
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("end-ellipsis");
    pages.push(totalPages);
  }
  return pages;
};

export default function Pagination({ currentPage = 1, totalPages = 0, onPageChange, maxVisible = 5, previousLabel = "Previous page", nextLabel = "Next page", ariaLabel = "Pagination", disabled = false, className = "" }) {
  if (totalPages <= 1) return null;
  const pages = getVisiblePages(currentPage, totalPages, maxVisible);
  const selectPage = (page) => {
    if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) onPageChange?.(page);
  };
  return (
    <nav className={`trem-pagination ${className}`.trim()} aria-label={ariaLabel}>
      <Button variant="outline" size="small" isCircular iconLeft="chevronLeft" disabled={disabled || currentPage <= 1} onClick={() => selectPage(currentPage - 1)} aria-label={previousLabel} />
      <div className="trem-pagination__pages">
        {pages.map((page) => typeof page === "number" ? (
          <Button key={page} variant={page === currentPage ? "solid" : "text"} color={page === currentPage ? "primary" : undefined} size="small" primaryClassName="trem-pagination__page" onClick={() => selectPage(page)} aria-label={`Page ${page}`} aria-current={page === currentPage ? "page" : undefined} disabled={disabled} text={String(page)} />
        ) : <span key={page} className="trem-pagination__ellipsis" aria-hidden="true">…</span>)}
      </div>
      <Button variant="outline" size="small" isCircular iconLeft="chevronRight" disabled={disabled || currentPage >= totalPages} onClick={() => selectPage(currentPage + 1)} aria-label={nextLabel} />
    </nav>
  );
}
