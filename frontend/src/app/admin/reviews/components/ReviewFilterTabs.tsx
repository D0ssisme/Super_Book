"use client";

import { useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewFilters } from "@/types/review.type";

interface ReviewFilterTabsProps {
  filters: ReviewFilters;
  onChange: (patch: Partial<ReviewFilters>) => void;
  onClear: () => void;
}

export default function ReviewFilterTabs({
  filters,
  onChange,
  onClear,
}: ReviewFilterTabsProps) {
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search.trim() !== "" ||
      filters.status !== "all" ||
      filters.rating !== "all" ||
      filters.fromDate !== "" ||
      filters.toDate !== ""
    );
  }, [filters]);

  return (
    <div className="space-y-4 bg-white shadow-2xl rounded-xl p-4 my-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Bộ lọc đánh giá</span>
        </div>

        {hasActiveFilters && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onClear}
            className="flex items-center gap-2 bg-red-300"
          >
            <X className="w-4 h-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Tìm kiếm</label>
          <Input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            placeholder="Tên user, sách, nội dung..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Trạng thái</label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onChange({
                status: value as ReviewFilters["status"],
                page: 1,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="hidden">Đã ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Số sao</label>
          <Select
            value={String(filters.rating)}
            onValueChange={(value) =>
              onChange({
                rating: value === "all" ? "all" : Number(value),
                page: 1,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn số sao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="5">5 sao</SelectItem>
              <SelectItem value="4">4 sao</SelectItem>
              <SelectItem value="3">3 sao</SelectItem>
              <SelectItem value="2">2 sao</SelectItem>
              <SelectItem value="1">1 sao</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Từ ngày</label>
          <Input
            type="date"
            value={filters.fromDate}
            onChange={(e) => onChange({ fromDate: e.target.value, page: 1 })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Đến ngày</label>
          <Input
            type="date"
            value={filters.toDate}
            onChange={(e) => onChange({ toDate: e.target.value, page: 1 })}
          />
        </div>
      </div>
    </div>
  );
}
