"use client";

import { useMemo, useState } from "react";

type ProductDescriptionSectionProps = {
  title: string;
  description: string;
};

const COLLAPSE_LENGTH = 320;

export default function ProductDescriptionSection({
  title,
  description,
}: ProductDescriptionSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const normalizedDescription = useMemo(() => {
    const trimmed = (description || "").trim();
    return trimmed.length > 0 ? trimmed : "Chưa có mô tả cho cuốn sách này.";
  }, [description]);

  const shouldCollapse = normalizedDescription.length > COLLAPSE_LENGTH;

  const displayText = useMemo(() => {
    if (!shouldCollapse || expanded) return normalizedDescription;
    return `${normalizedDescription.slice(0, COLLAPSE_LENGTH).trimEnd()}...`;
  }, [expanded, normalizedDescription, shouldCollapse]);

  return (
    <section className="bg-white rounded-xl shadow-md p-6 border border-green-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Mô tả sản phẩm</h3>

      <div className="rounded-lg bg-green-50/50 border border-green-100 p-4">
        <p className="text-base font-semibold text-gray-900">{title || "Sách"}</p>
        <div
          className={`relative mt-3 overflow-hidden ${
            shouldCollapse && !expanded ? "max-h-28" : ""
          }`}
        >
          <p className="text-gray-700 leading-7 whitespace-pre-line">{displayText}</p>
          {shouldCollapse && !expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent via-green-50/80 to-green-50/95" />
          )}
        </div>
      </div>

      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 block w-full text-center text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </section>
  );
}
