export type ReviewStatus = "pending" | "approved" | "hidden";

export interface ReviewUser {
  _id: string;
  fullName: string;
  email: string;
}

export interface ReviewBook {
  _id: string;
  name: string;
  imageUrl?: string[];
  category?: string;
 
  mainImage?:string;
}

export interface ReviewOrder {
  _id: string;
  purchaseDate: string;
}

export interface ReviewItem {
  _id: string;
  rating: number;
  content: string;
  images?: string[];
  status: ReviewStatus;
  moderationNote?: string;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  book: ReviewBook;
  order?: ReviewOrder;
}

export interface ReviewDetail extends ReviewItem {
  images: string[];
}

export interface ReviewFilters {
  page: number;
  limit: number;
  status: ReviewStatus | "all";
  rating: number | "all";
  search: string;
  fromDate: string;
  toDate: string;
}

export interface ReviewPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ReviewListResponse {
  data: ReviewItem[];
  pagination: ReviewPagination;
}

export interface ReviewStats {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  hiddenReviews: number;
  averageRating: number;
  lowRatingReviews: number;
}

export interface UpdateReviewStatusPayload {
  status: ReviewStatus;
  moderationNote?: string;
}

export interface MyReviewFilters {
  page: number;
  limit: number;
  status?: ReviewStatus | "all";
}

export interface CreateMyReviewPayload {
  bookId: string;
  orderId?: string;
  rating: number;
  content?: string;
  images?: string[];
}

export interface UpdateMyReviewPayload {
  rating?: number;
  content?: string;
  images?: string[];
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
  orderId?: string;
  reviewId?: string;
}

export interface PublicBookReviewFilters {
  page: number;
  limit: number;
  rating?: number | "all";
  sort?: "newest" | "oldest" | "highest" | "lowest";
}

export interface PublicBookReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
