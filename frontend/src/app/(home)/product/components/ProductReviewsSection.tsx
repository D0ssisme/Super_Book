"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reviewServices } from "@/services/reviewServices";
import { ReviewStars } from "@/components/review/ReviewStars";
import { resolveImageUrl } from "@/utils/image-url";

const PAGE_SIZE = 5;

export default function ProductReviewsSection({ bookId }: { bookId: string }) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  const { data: stats, isLoading: isLoadingStats } = useSWR(
    ["book-review-stats", bookId],
    () => reviewServices.getPublicBookReviewStats(bookId)
  );

  const { data: reviewList, isLoading: isLoadingReviews } = useSWR(
    ["book-reviews", bookId, page, sortBy, ratingFilter],
    () =>
      reviewServices.getPublicBookReviews(bookId, {
        page,
        limit: PAGE_SIZE,
        sort: sortBy,
        rating: ratingFilter,
      })
  );

  const reviews = reviewList?.data ?? [];
  const pagination = reviewList?.pagination;

  const breakdownPercent = useMemo(() => {
    const total = stats?.totalReviews ?? 0;
    if (!total || !stats) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }

    return {
      1: (stats.ratingBreakdown[1] / total) * 100,
      2: (stats.ratingBreakdown[2] / total) * 100,
      3: (stats.ratingBreakdown[3] / total) * 100,
      4: (stats.ratingBreakdown[4] / total) * 100,
      5: (stats.ratingBreakdown[5] / total) * 100,
    };
  }, [stats]);

  return (
    <Card className="bg-white rounded-xl shadow-md border border-green-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-gray-900">Đánh giá từ người mua</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoadingStats ? (
          <div className="py-6 text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải thống kê đánh giá...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 rounded-lg border border-gray-100 p-4 bg-gray-50/60">
            <div className="text-center md:text-left">
              <div className="text-4xl font-bold text-gray-900">
                {Number(stats?.averageRating || 0).toFixed(1)}
              </div>
              <ReviewStars value={Math.round(stats?.averageRating || 0)} className="justify-center md:justify-start mt-2" />
              <p className="text-sm text-gray-500 mt-1">{stats?.totalReviews || 0} đánh giá</p>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="grid grid-cols-[40px_1fr_36px] items-center gap-2 text-sm">
                  <span className="text-gray-600">{star} sao</span>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${breakdownPercent[star as 1 | 2 | 3 | 4 | 5]}%` }} />
                  </div>
                  <span className="text-gray-500 text-right">{stats?.ratingBreakdown?.[star as 1 | 2 | 3 | 4 | 5] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={ratingFilter === "all" ? "default" : "outline"}
              onClick={() => {
                setRatingFilter("all");
                setPage(1);
              }}
            >
              Tất cả
            </Button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                size="sm"
                variant={ratingFilter === rating ? "default" : "outline"}
                onClick={() => {
                  setRatingFilter(rating);
                  setPage(1);
                }}
              >
                {rating} sao
              </Button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as "newest" | "oldest" | "highest" | "lowest");
              setPage(1);
            }}
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="highest">Sao cao trước</option>
            <option value="lowest">Sao thấp trước</option>
          </select>
        </div>

        {isLoadingReviews ? (
          <div className="py-10 text-center text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải đánh giá...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 border border-dashed rounded-xl text-center text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            Chưa có đánh giá được duyệt cho sản phẩm này
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-xl border p-4 bg-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{review.user.fullName || "Khách hàng"}</p>
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <ReviewStars value={review.rating} />
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{review.content || "(Không có nội dung)"}</p>

                {Array.isArray(review.images) && review.images.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.images.slice(0, 4).map((imageUrl, idx) => (
                      <div key={`${review._id}-${idx}`} className="relative w-20 h-20 rounded-md border overflow-hidden bg-gray-100">
                        <Image
                          src={resolveImageUrl(imageUrl)}
                          alt={`review-image-${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pt-1">
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
    </Card>
  );
}
