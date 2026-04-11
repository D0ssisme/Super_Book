"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { MessageSquare, EyeOff, CheckCircle, CircleSlash } from "lucide-react";
import { toast } from "sonner";
import Pagination from "../components/Pagination";
import ReviewFilterTabs from "./components/ReviewFilterTabs";
import ReviewTable from "./components/ReviewTable";
import ReviewDetailDialog from "./components/ReviewDetailDialog";
import ReviewModerationDialog from "./components/ReviewModerationDialog";
import { reviewServices } from "@/services/reviewServices";
import { ReviewFilters, ReviewItem, ReviewStats, ReviewStatus } from "@/types/review.type";

const defaultFilters: ReviewFilters = {
  page: 1,
  limit: 10,
  status: "all",
  rating: "all",
  search: "",
  fromDate: "",
  toDate: "",
};

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  // State lưu bộ lọc hiện tại (trang, trạng thái, rating, từ khóa,...)
  const [filters, setFilters] = useState<ReviewFilters>(defaultFilters);

  // State lưu id review đang chọn để xem chi tiết
  const [selectedReviewId, setSelectedReviewId] = useState<string>("");

  // State điều khiển dialog chi tiết review
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // State điều khiển dialog ẩn review + lý do kiểm duyệt.
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  // State lưu review của ai,sản phẩm nào 
  const [targetReview, setTargetReview] = useState<ReviewItem | null>(null);
  //lưu lý do kiểm duyệt khi ấn ẩn review
  const [moderationReason, setModerationReason] = useState("");
  const [moderationError, setModerationError] = useState("");
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false);

  // Lấy danh sách review theo filters (SWR tự cache + revalidate)
  const {
    data: listData,
    isLoading,
    mutate: mutateReviews,
  } = useSWR(["admin-reviews", filters], () => reviewServices.getAdminReviews(filters));

  // Lấy thống kê review tổng quan
  const { data: statsData, mutate: mutateStats } = useSWR<ReviewStats>(
    "admin-review-stats",
    () => reviewServices.getReviewStats()
  );

  // Chuẩn hóa dữ liệu thống kê: nếu chưa có data thì dùng giá trị mặc định
  const stats = useMemo(() => {
    return (
      statsData ?? {
        totalReviews: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        hiddenReviews: 0,
        averageRating: 0,
        lowRatingReviews: 0,
      }
    );
  }, [statsData]);

  // Dữ liệu danh sách review và phân trang fallback khi chưa có data
  const reviews = listData?.data ?? [];
  const pagination = listData?.pagination ?? {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: filters.limit,
    hasNext: false,
    hasPrev: false,
  };

  // Cập nhật 1 phần filters (merge với filters cũ)
  const updateFilters = (patch: Partial<ReviewFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  // Mở dialog xem chi tiết review
  const handleView = (review: ReviewItem) => {
    setSelectedReviewId(review._id);
    setIsDetailOpen(true);
  };

  // Hàm dùng lại để refresh cả danh sách và thống kê sau khi mutate
  const refreshAllData = async () => {
    await Promise.all([mutateReviews(), mutateStats()]);
  };

  const updateReviewStatus = async (reviewId: string, status: ReviewStatus, moderationNote = "") => {
    await reviewServices.updateReviewStatus(reviewId, {
      status,
      moderationNote,
    });
    await refreshAllData();
  };

  const closeModerationDialog = () => {
    setIsModerationOpen(false);
    setTargetReview(null);
    setModerationReason("");
    setModerationError("");
  };

  const handleConfirmHiddenStatus = async () => {
    if (!targetReview) return;

    const normalizedReason = moderationReason.trim();
    if (!normalizedReason) {
      setModerationError("Vui lòng nhập lý do khi ẩn đánh giá");
      return;
    }

    try {
      setIsSubmittingModeration(true);
      await updateReviewStatus(targetReview._id, "hidden", normalizedReason);
      toast.success("Đã ẩn đánh giá");
      closeModerationDialog();
    } catch (error) {
      setModerationError("Cập nhật trạng thái thất bại");
    } finally {
      setIsSubmittingModeration(false);
    }
  };

  // Đổi trạng thái review (pending/approved/hidden...)
  const handleStatusChange = async (review: ReviewItem, status: ReviewStatus) => {
    if (status === "hidden") {
      setTargetReview(review);
      setModerationReason(review.moderationNote || "");
      setModerationError("");
      setIsModerationOpen(true);
      return;
    }

    try {
      // Clear note khi duyệt/chuyển pending để tránh giữ lý do cũ.
      await updateReviewStatus(review._id, status, "");
      toast.success("Cập nhật trạng thái thành công");
    } catch (error) {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white border-l-4 border-emerald-600 px-6 py-5 rounded-lg shadow-sm mb-6">
        <h2 className="text-gray-800 text-2xl font-bold">Quản lý đánh giá</h2>
        <p className="text-gray-600 text-sm mt-1">
       Quản lý các đánh giá review sách từ khách hàng
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Tổng đánh giá"
          value={stats.totalReviews}
          icon={<MessageSquare className="w-5 h-5 text-white" />}
          color="bg-emerald-500"
        />
        <StatCard
          title="Chờ duyệt"
          value={stats.pendingReviews}
          icon={<CircleSlash className="w-5 h-5 text-white" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="Đã duyệt"
          value={stats.approvedReviews}
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Đã ẩn"
          value={stats.hiddenReviews}
          icon={<EyeOff className="w-5 h-5 text-white" />}
          color="bg-gray-500"
        />
        <StatCard
          title="Điểm trung bình"
          value={Number.isFinite(stats.averageRating) ? stats.averageRating.toFixed(1) : "0.0"}
          icon={<MessageSquare className="w-5 h-5 text-white" />}
          color="bg-indigo-500"
        />
      </div>

 {/* Bộ lọc: truyền state hiện tại + hàm cập nhật + hàm reset bộ lọc */}
      <ReviewFilterTabs
        filters={filters}
        onChange={updateFilters}
        onClear={() => setFilters(defaultFilters)}
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      ) : (
        <>

       {/* Bảng review: truyền data và các hành động thao tác trên từng review */}
          <ReviewTable
            reviews={reviews}
            onView={handleView}
            onStatusChange={handleStatusChange}
          />

           {/* Phân trang: truyền thông tin trang hiện tại + callback đổi trang/đổi số dòng */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.limit}
            onPageChange={(page) => updateFilters({ page })}
            onItemsPerPageChange={(itemsPerPage) =>
              updateFilters({ limit: itemsPerPage, page: 1 })
            }
          />
        </>
      )}
{/* Dialog chi tiết: truyền id review đang chọn + trạng thái mở/đóng dialog */}
      <ReviewDetailDialog
        reviewId={selectedReviewId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

{/*Dialog ẩn review: truyền review đang chọn + lý do kiểm duyệt  */}
      <ReviewModerationDialog
        open={isModerationOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModerationDialog();
            return;
          }
          setIsModerationOpen(true);
        }}
        review={targetReview}
        reason={moderationReason}
        onReasonChange={(value) => {
          setModerationReason(value);
          if (moderationError) {
            setModerationError("");
          }
        }}
        onConfirm={handleConfirmHiddenStatus}
        loading={isSubmittingModeration}
        error={moderationError}
      />
    </div>
  );
}
