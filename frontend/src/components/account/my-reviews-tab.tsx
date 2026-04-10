"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Loader2, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reviewServices } from "@/services/reviewServices";
import { ReviewItem, ReviewStatus } from "@/types/review.type";
import { resolveBookCover, resolveImageUrl } from "@/utils/image-url";
import { ReviewStars } from "@/components/review/ReviewStars";
import { ReviewFormDialog } from "@/components/review/ReviewFormDialog";

const PAGE_SIZE = 5;

const FILTER_OPTIONS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "hidden", label: "Đã ẩn" },
];

function statusBadge(status: ReviewStatus) {
  if (status === "approved") {
    return <Badge className="bg-green-100 text-green-700">Đã duyệt</Badge>;
  }
  if (status === "hidden") {
    return <Badge className="bg-gray-200 text-gray-700">Đã ẩn</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-700">Chờ duyệt</Badge>;
}

export function MyReviewsTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    ["my-reviews", page, statusFilter],
    () =>
      reviewServices.getMyReviews({
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
      })
  );

  const reviews = data?.data ?? [];
  const pagination = data?.pagination;

  const emptyMessage = useMemo(() => {
    if (statusFilter === "all") {
      return "Bạn chưa có đánh giá nào";
    }
    return "Không có đánh giá phù hợp với bộ lọc";
  }, [statusFilter]);

  const handleDelete = async (reviewId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa đánh giá này?");
    if (!confirmed) return;

    try {
      await reviewServices.deleteMyReview(reviewId);
      toast.success("Đã xóa đánh giá");
      await mutate();
    } catch (error) {
      toast.error("Không thể xóa đánh giá");
    }
  };

  const handleUpdate = async (payload: { rating: number; content: string; images: string[] }) => {
    if (!editingReview) return;

    try {
      setIsSubmitting(true);
      await reviewServices.updateMyReview(editingReview._id, payload);
      toast.success("Đã cập nhật đánh giá, vui lòng chờ duyệt lại");
      setEditingReview(null);
      await mutate();
    } catch (error) {
      toast.error("Không thể cập nhật đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent lg:bg-white lg:border lg:shadow-sm">
      <CardHeader className="px-0 lg:px-6 pt-0 lg:pt-6">
        <CardTitle className="text-xl">Đánh giá của tôi</CardTitle>
        <CardDescription>Quản lý các đánh giá bạn đã gửi cho sản phẩm đã mua</CardDescription>
      </CardHeader>

      <CardContent className="px-0 lg:px-6 pb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải đánh giá...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed min-h-[260px] flex flex-col items-center justify-center p-8 text-center">
            <MessageSquareText className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-gray-700 font-medium">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white border rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="relative w-16 h-20 rounded-md border overflow-hidden shrink-0 bg-gray-50">
                    <Image
                      src={resolveBookCover(review.book)}
                      alt={review.book.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <h4 className="font-semibold text-gray-900 line-clamp-1" title={review.book.name}>
                        {review.book.name}
                      </h4>
                      {statusBadge(review.status)}
                    </div>

                    <ReviewStars value={review.rating} />

                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{review.content || "(Không có nội dung)"}</p>

                    {Array.isArray(review.images) && review.images.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {review.images.slice(0, 4).map((imageUrl, idx) => (
                          <div key={`${review._id}-${idx}`} className="relative w-12 h-12 rounded border overflow-hidden bg-gray-50">
                            <Image
                              src={resolveImageUrl(imageUrl)}
                              alt={`review-${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {review.moderationNote ? (
                      <p className="text-xs text-orange-700 bg-orange-50 rounded-md px-2 py-1 border border-orange-100">
                        Ghi chú kiểm duyệt: {review.moderationNote}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleString("vi-VN")}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingReview(review)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(review._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Trang trước
            </Button>
            <span className="text-sm text-gray-600">
              Trang {pagination.currentPage}/{pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            >
              Trang sau
            </Button>
          </div>
        ) : null}
      </CardContent>

      <ReviewFormDialog
        open={!!editingReview}
        onOpenChange={(open) => {
          if (!open) setEditingReview(null);
        }}
        title="Chỉnh sửa đánh giá"
        description={editingReview?.book?.name}
        submitText="Lưu thay đổi"
        loading={isSubmitting}
        onUploadImages={reviewServices.uploadReviewImages}
        initialValues={{
          rating: editingReview?.rating,
          content: editingReview?.content,
          images: editingReview?.images,
        }}
        onSubmit={handleUpdate}
      />
    </Card>
  );
}
