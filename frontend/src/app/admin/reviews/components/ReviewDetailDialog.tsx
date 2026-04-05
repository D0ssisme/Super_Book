"use client";

import Image from "next/image";
import useSWR from "swr";
import { Loader2, Star, User, BookOpen, Calendar, Package2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { reviewServices } from "@/services/reviewServices";
import { resolveBookCover, resolveImageUrl } from "@/utils/image-url";

interface ReviewDetailDialogProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function statusBadge(status: "pending" | "approved" | "hidden") {
  if (status === "approved") {
    return <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>;
  }
  if (status === "hidden") {
    return <Badge className="bg-gray-200 text-gray-800">Đã ẩn</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
}

export default function ReviewDetailDialog({
  reviewId,
  open,
  onOpenChange,
}: ReviewDetailDialogProps) {
  const { data: review, isLoading } = useSWR(
    open && reviewId ? ["admin-review-detail", reviewId] : null,
    () => reviewServices.getReviewDetailById(reviewId),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết đánh giá</DialogTitle>
          <DialogDescription>Thông tin review của người dùng</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : !review ? (
          <div className="text-center py-8 text-gray-500">Không tìm thấy dữ liệu</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <User className="w-4 h-4" />
                  Người dùng
                </div>
                <p className="font-semibold text-gray-800">{review.user.fullName}</p>
                <p className="text-sm text-gray-600">{review.user.email}</p>
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <BookOpen className="w-4 h-4" />
                  Sản phẩm
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-16 rounded overflow-hidden border bg-white">
                    <Image
                      src={resolveBookCover(review.book)}
                      alt={review.book.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{review.book.name}</p>
                    {review.book.category && (
                      <p className="text-xs text-gray-500 mt-0.5">Thể loại: {review.book.category}</p>
                    )}
                  </div>
                </div>
                {review.order && (
                  <p className="text-sm text-gray-600 mt-1">Mã đơn: #{review.order._id}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-4 h-4 ${idx < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              {statusBadge(review.status)}
              <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {new Date(review.createdAt).toLocaleString("vi-VN")}
              </span>
              {review.order && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  <Package2 className="w-4 h-4" />
                  {new Date(review.order.purchaseDate).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>

            <div className="rounded-lg border p-4 bg-white">
              <h4 className="font-semibold text-gray-800 mb-2">Nội dung đánh giá</h4>
              <p className="text-gray-700 leading-relaxed">{review.content}</p>
            </div>

            {review.moderationNote && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h4 className="font-semibold text-amber-900 mb-1">Ghi chú kiểm duyệt</h4>
                <p className="text-amber-800 text-sm">{review.moderationNote}</p>
              </div>
            )}

            {review.images.length > 0 && (
              <div className="rounded-lg border p-4 bg-white">
                <h4 className="font-semibold text-gray-800 mb-3">Ảnh đính kèm</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {review.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={resolveImageUrl(img)}
                        alt={`review-image-${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
