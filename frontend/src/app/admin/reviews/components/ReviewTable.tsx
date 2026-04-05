"use client";

import Image from "next/image";
import { Eye, MoreHorizontal, Star, CheckCircle, EyeOff, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReviewItem, ReviewStatus } from "@/types/review.type";
import { resolveBookCover } from "@/utils/image-url";

interface ReviewTableProps {
  reviews: ReviewItem[];
  onView: (review: ReviewItem) => void;
  onStatusChange: (review: ReviewItem, status: ReviewStatus) => void;
  onDelete: (review: ReviewItem) => void;
}

function renderRating(rating: number) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => {
        const active = idx < rating;
        return (
          <Star
            key={idx}
            className={`w-4 h-4 ${active ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        );
      })}
    </div>
  );
}

function statusBadge(status: ReviewStatus) {
  if (status === "approved") {
    return <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>;
  }
  if (status === "hidden") {
    return <Badge className="bg-gray-200 text-gray-800">Đã ẩn</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
}

export default function ReviewTable({
  reviews,
  onView,
  onStatusChange,
  onDelete,
}: ReviewTableProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 my-4 bg-white rounded-lg shadow-2xl">
        <p className="text-sm font-semibold text-gray-900">Không có đánh giá</p>
        <p className="text-sm text-gray-500 mt-1">Hãy thử thay đổi bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-2xl p-4">
      <Table>
        <TableHeader>
          <TableRow className="bg-white">
            <TableHead className="font-semibold text-center">Ảnh</TableHead>
            <TableHead className="font-semibold">Sản phẩm</TableHead>
            <TableHead className="font-semibold">Người dùng</TableHead>
            <TableHead className="font-semibold text-center">Số sao</TableHead>
            <TableHead className="font-semibold">Nội dung</TableHead>
            <TableHead className="font-semibold text-center">Trạng thái</TableHead>
            <TableHead className="font-semibold text-center">Ngày tạo</TableHead>
            <TableHead className="text-right font-semibold">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review._id} className="hover:bg-gray-50">
              <TableCell className="text-center">
                <Image
                  src={resolveBookCover(review.book)}
                  alt={review.book.name}
                  width={48}
                  height={64}
                  className="w-12 h-16 object-cover rounded border border-gray-200 mx-auto"
                  unoptimized
                />
              </TableCell>
              <TableCell className="font-medium text-gray-800 max-w-[220px] truncate">
                {review.book.name}
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-800">{review.user.fullName}</div>
                <div className="text-xs text-gray-500">{review.user.email}</div>
              </TableCell>
              <TableCell className="text-center">{renderRating(review.rating)}</TableCell>
              <TableCell className="max-w-[340px] truncate text-gray-700">
                {review.content}
              </TableCell>
              <TableCell className="text-center">{statusBadge(review.status)}</TableCell>
              <TableCell className="text-center text-gray-600">
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Tác vụ</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(review)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onStatusChange(review, "approved")}
                      disabled={review.status === "approved"}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Duyệt
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange(review, "hidden")}
                      disabled={review.status === "hidden"}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Ẩn đánh giá
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange(review, "pending")}
                      disabled={review.status === "pending"}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Chuyển chờ duyệt
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(review)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
