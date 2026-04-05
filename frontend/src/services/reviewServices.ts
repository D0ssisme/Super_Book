import api from "@/lib/axios";
import {
  ReviewDetail,
  ReviewFilters,
  ReviewItem,
  ReviewListResponse,
  ReviewPagination,
  ReviewStats,
  UpdateReviewStatusPayload,
} from "@/types/review.type";
import {
  deleteMockReviewById,
  getMockReviewDetail,
  getMockReviewList,
  getMockReviewStats,
  updateMockReviewStatus,
} from "@/services/mocks/reviewMockStore";


function shouldFallback(error: unknown): boolean {
  // Quyet dinh co chuyen qua mock hay khong khi goi API that bai.
  // Hien tai fallback khi: mat mang, 404/405, hoac loi server 5xx.
  const status = (error as { response?: { status?: number } })?.response?.status;
  return !status || status === 404 || status === 405 || status >= 500;
}

function toPagination(totalItems: number, page: number, limit: number): ReviewPagination {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    totalItems,
    totalPages,
    currentPage: page,
    limit,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export const reviewServices = {
  // API-first: moi ham deu uu tien goi backend truoc, mock chi la fallback khi loi.
  async getAdminReviews(filters: ReviewFilters): Promise<ReviewListResponse> {
    try {
      // Luong chinh: goi backend de lay danh sach review theo bo loc.
      const response = await api.get("/reviews/admin", { params: filters });
      const data = response.data?.data ?? [];
      const pagination = response.data?.pagination ??
        toPagination(data.length, filters.page, filters.limit);
      return { data, pagination };
    } catch (error) {
      if (shouldFallback(error)) {
        // Luong du phong: backend chua co/bi loi => dung mock.
        return getMockReviewList(filters);
      }
      throw error;
    }
  },

  async getReviewDetailById(reviewId: string): Promise<ReviewDetail> {
    try {
      // Luong chinh: goi backend de lay chi tiet 1 review.
      const response = await api.get(`/reviews/admin/${reviewId}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      if (shouldFallback(error)) {
        // Luong du phong: tim review tu mock.
        const found = getMockReviewDetail(reviewId);
        if (!found) {
          throw new Error("Khong tim thay danh gia");
        }
        return found;
      }
      throw error;
    }
  },

  async updateReviewStatus(
    reviewId: string,
    payload: UpdateReviewStatusPayload
  ): Promise<ReviewItem> {
    try {
      // Luong chinh: goi backend de doi trang thai review.
      const response = await api.put(`/reviews/admin/${reviewId}/status`, payload);
      return response.data?.data ?? response.data;
    } catch (error) {
      if (shouldFallback(error)) {
        // Luong du phong: cap nhat truc tiep tren mockReviews.
        const updated = updateMockReviewStatus(reviewId, payload);
        if (!updated) {
          throw new Error("Khong tim thay danh gia");
        }
        return updated;
      }
      throw error;
    }
  },

  async deleteReview(reviewId: string): Promise<void> {
    try {
      // Luong chinh: goi backend de xoa review.
      await api.delete(`/reviews/admin/${reviewId}`);
    } catch (error) {
      if (shouldFallback(error)) {
        // Luong du phong: xoa review trong mockReviews.
        deleteMockReviewById(reviewId);
        return;
      }
      throw error;
    }
  },

  async getReviewStats(): Promise<ReviewStats> {
    try {
      // Luong chinh: goi backend de lay thong ke review.
      const response = await api.get("/reviews/admin/stats");
      return response.data?.data ?? response.data;
    } catch (error) {
      if (shouldFallback(error)) {
        // Luong du phong: tinh thong ke tu mockReviews.
        return getMockReviewStats();
      }
      throw error;
    }
  },
};
