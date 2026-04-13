import {
  ReviewDetail,
  ReviewFilters,
  ReviewItem,
  ReviewListResponse,
  ReviewPagination,
  ReviewStats,
  ReviewStatus,
  UpdateReviewStatusPayload,
} from "@/types/review.type";

const now = new Date();
const oneDay = 24 * 60 * 60 * 1000;

const mockBookCatalog = [
  {
    _id: "b1",
    name: "Bí Kíp Võ Lâm",
    category: "Võ hiệp",
    mainImage: "/images/books/clean_code.jpg",
  },
  {
    _id: "b2",
    name: "Tuyệt Kỹ Giang Hồ",
    category: "Võ hiệp",
    mainImage: "/images/books/de_me_plk.jpg",
  },
  {
    _id: "b3",
    name: "Đột Phá Bản Thân",
    category: "Phát triển bản thân",
    mainImage: "/images/books/refactoring.jpg",
  },
  {
    _id: "b4",
    name: "Thần Công Bí Ẩn",
    category: "Huyền bí",
    mainImage: "/images/books/truyen_co_tich.jpg",
  },
  {
    _id: "b5",
    name: "Tuyệt Thế Thần Công",
    category: "Tuyệt kỹ",
    mainImage: "/images/books/harry_potter_va_hon_da_phu_thuy.jpg",
  },
  {
    _id: "b6",
    name: "Kinh Tế Công Phá",
    category: "Kinh tế",
    mainImage: "/images/books/kinh_te_hoc.jpg",
  },
  {
    _id: "b7",
    name: "Thanh Kiếm Mockingbird",
    category: "Văn học",
    mainImage: "/images/books/To_Kill_a_Mockingbird.jpg",
  },
] as const;

const bookById = new Map(
  mockBookCatalog.map((book) => [book._id, { ...book, imageUrl: [book.mainImage] }])
);

type MockReviewSeed = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  bookId: (typeof mockBookCatalog)[number]["_id"];
  rating: number;
  content: string;
  status: ReviewStatus;
  createdDaysAgo: number;
  purchaseDaysAgo: number;
  withImages?: boolean;
  moderationNote?: string;
};

const mockReviewSeeds: MockReviewSeed[] = [
  { id: "rv1", userId: "u1", fullName: "Nguyen Van A", email: "a.user@example.com", bookId: "b1", rating: 5, content: "Sach dong goi rat ky, giao nhanh, chat luong in dep.", status: "approved", createdDaysAgo: 2, purchaseDaysAgo: 4, withImages: true },
  { id: "rv2", userId: "u2", fullName: "Tran Thi B", email: "b.user@example.com", bookId: "b2", rating: 2, content: "Noi dung hay nhung sach bi cong mep nhe.", status: "pending", createdDaysAgo: 1, purchaseDaysAgo: 3, withImages: true },
  { id: "rv3", userId: "u3", fullName: "Le Van C", email: "c.user@example.com", bookId: "b3", rating: 3, content: "Tam on, phu hop nguoi moi hoc.", status: "approved", createdDaysAgo: 6, purchaseDaysAgo: 7 },
  { id: "rv4", userId: "u4", fullName: "Pham Thi D", email: "d.user@example.com", bookId: "b4", rating: 1, content: "Khong dung mo ta, can kiem tra lai lo hang.", status: "hidden", createdDaysAgo: 8, purchaseDaysAgo: 10, moderationNote: "Noi dung da duoc kiem duyet va an tam thoi." },
  { id: "rv5", userId: "u5", fullName: "Do Van E", email: "e.user@example.com", bookId: "b5", rating: 4, content: "Gia hop ly, noi dung de ap dung.", status: "pending", createdDaysAgo: 5, purchaseDaysAgo: 6, withImages: true },
  { id: "rv6", userId: "u6", fullName: "Vo Thi F", email: "f.user@example.com", bookId: "b6", rating: 5, content: "Noi dung thuc chien, ap dung duoc ngay.", status: "approved", createdDaysAgo: 3, purchaseDaysAgo: 6, withImages: true },
  { id: "rv7", userId: "u7", fullName: "Hoang Van G", email: "g.user@example.com", bookId: "b7", rating: 4, content: "Doc cuon hut, tinh tiet hay.", status: "approved", createdDaysAgo: 4, purchaseDaysAgo: 8, withImages: true },
  { id: "rv8", userId: "u8", fullName: "Bui Thi H", email: "h.user@example.com", bookId: "b1", rating: 3, content: "Sach onn, in dep, giao dung hen.", status: "pending", createdDaysAgo: 7, purchaseDaysAgo: 9 },
  { id: "rv9", userId: "u9", fullName: "Ngo Van I", email: "i.user@example.com", bookId: "b2", rating: 2, content: "Bia sach dep, ben trong tam on.", status: "hidden", createdDaysAgo: 9, purchaseDaysAgo: 11, moderationNote: "An tam thoi de kiem tra phan noi dung nhay cam.", withImages: true },
  { id: "rv10", userId: "u10", fullName: "Dang Thi K", email: "k.user@example.com", bookId: "b3", rating: 5, content: "Rat truyen cam hung, de doc.", status: "approved", createdDaysAgo: 10, purchaseDaysAgo: 13, withImages: true },
  { id: "rv11", userId: "u11", fullName: "Phan Van L", email: "l.user@example.com", bookId: "b4", rating: 4, content: "Noi dung kha cuon hut, hinh minh hoa dep.", status: "pending", createdDaysAgo: 11, purchaseDaysAgo: 14, withImages: true },
  { id: "rv12", userId: "u12", fullName: "Ly Thi M", email: "m.user@example.com", bookId: "b5", rating: 1, content: "Nhan sai phien ban, da lien he ho tro.", status: "hidden", createdDaysAgo: 12, purchaseDaysAgo: 15, moderationNote: "Da tiep nhan va an review trong khi xu ly don.", withImages: true },
  { id: "rv13", userId: "u13", fullName: "Mai Van N", email: "n.user@example.com", bookId: "b6", rating: 5, content: "Gia tri vuot mong doi, nen mua.", status: "approved", createdDaysAgo: 13, purchaseDaysAgo: 16 },
  { id: "rv14", userId: "u14", fullName: "Chu Thi O", email: "o.user@example.com", bookId: "b7", rating: 3, content: "Do doc on, can them vi du thuc te.", status: "pending", createdDaysAgo: 14, purchaseDaysAgo: 18, withImages: true },
  { id: "rv15", userId: "u15", fullName: "Trinh Van P", email: "p.user@example.com", bookId: "b1", rating: 4, content: "Dong goi can than, sach moi.", status: "approved", createdDaysAgo: 15, purchaseDaysAgo: 19, withImages: true },
  { id: "rv16", userId: "u16", fullName: "Kieu Thi Q", email: "q.user@example.com", bookId: "b2", rating: 2, content: "Noi dung nhieu chu, can bo cuc de doc hon.", status: "pending", createdDaysAgo: 16, purchaseDaysAgo: 20 },
  { id: "rv17", userId: "u17", fullName: "Ta Van R", email: "r.user@example.com", bookId: "b3", rating: 5, content: "Dung thuat ngu, de hieu cho nguoi moi.", status: "approved", createdDaysAgo: 17, purchaseDaysAgo: 21, withImages: true },
  { id: "rv18", userId: "u18", fullName: "Phung Thi S", email: "s.user@example.com", bookId: "b4", rating: 4, content: "Phan vo cong va ky nang rat hay.", status: "approved", createdDaysAgo: 18, purchaseDaysAgo: 22, withImages: true },
  { id: "rv19", userId: "u19", fullName: "Duong Van T", email: "t.user@example.com", bookId: "b5", rating: 3, content: "On trong tam gia, giao hang nhanh.", status: "pending", createdDaysAgo: 19, purchaseDaysAgo: 23 },
  { id: "rv20", userId: "u20", fullName: "Lam Thi U", email: "u.user@example.com", bookId: "b6", rating: 1, content: "Trang sach bi lep, can doi tra.", status: "hidden", createdDaysAgo: 20, purchaseDaysAgo: 24, moderationNote: "Da huong dan khach doi tra, tam an review." },
  { id: "rv21", userId: "u21", fullName: "Quach Van V", email: "v.user@example.com", bookId: "b7", rating: 5, content: "Rat dang doc lai nhieu lan.", status: "approved", createdDaysAgo: 21, purchaseDaysAgo: 25, withImages: true },
  { id: "rv22", userId: "u22", fullName: "Vu Thi W", email: "w.user@example.com", bookId: "b1", rating: 4, content: "Phu hop qua lam qua tang.", status: "pending", createdDaysAgo: 22, purchaseDaysAgo: 26, withImages: true },
  { id: "rv23", userId: "u23", fullName: "Nong Van X", email: "x.user@example.com", bookId: "b2", rating: 5, content: "Chat luong in dep, mau sac tot.", status: "approved", createdDaysAgo: 23, purchaseDaysAgo: 27, withImages: true },
  { id: "rv24", userId: "u24", fullName: "Ha Thi Y", email: "y.user@example.com", bookId: "b3", rating: 3, content: "Tam duoc, ky vong phien ban cap nhat.", status: "pending", createdDaysAgo: 24, purchaseDaysAgo: 28, withImages: true },
];

function buildMockReview(seed: MockReviewSeed): ReviewDetail {
  const book = bookById.get(seed.bookId);
  if (!book) {
    throw new Error(`Invalid mock bookId: ${seed.bookId}`);
  }

  const createdAt = new Date(now.getTime() - oneDay * seed.createdDaysAgo).toISOString();
  const purchaseDate = new Date(now.getTime() - oneDay * seed.purchaseDaysAgo).toISOString();

  return {
    _id: seed.id,
    rating: seed.rating,
    content: seed.content,
    status: seed.status,
    moderationNote: seed.moderationNote,
    createdAt,
    updatedAt: createdAt,
    user: {
      _id: seed.userId,
      fullName: seed.fullName,
      email: seed.email,
    },
    book,
    order: {
      _id: `o${seed.id.replace("rv", "")}`,
      purchaseDate,
    },
    images: seed.withImages ? [book.mainImage] : [],
  };
}

function buildMockReviewIndex(records: ReviewDetail[]): Map<string, number> {
  return new Map(records.map((review, index) => [review._id, index]));
}

let mockReviews: ReviewDetail[] = mockReviewSeeds.map(buildMockReview);
let mockReviewIndexById = buildMockReviewIndex(mockReviews);

function getMockReviewIndexById(reviewId: string): number {
  return mockReviewIndexById.get(reviewId) ?? -1;
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

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

export function getMockReviewList(filters: ReviewFilters): ReviewListResponse {
  const hasStatusFilter = filters.status !== "all";
  const hasRatingFilter = filters.rating !== "all";
  const hasSearch = filters.search.trim() !== "";
  const searchText = hasSearch ? normalize(filters.search) : "";

  let fromTime = Number.NEGATIVE_INFINITY;
  if (filters.fromDate) {
    const from = new Date(filters.fromDate);
    from.setHours(0, 0, 0, 0);
    fromTime = from.getTime();
  }

  let toTime = Number.POSITIVE_INFINITY;
  if (filters.toDate) {
    const to = new Date(filters.toDate);
    to.setHours(23, 59, 59, 999);
    toTime = to.getTime();
  }

  const records = mockReviews.filter((review) => {
    if (hasStatusFilter && review.status !== filters.status) {
      return false;
    }
    if (hasRatingFilter && review.rating !== Number(filters.rating)) {
      return false;
    }
    if (hasSearch) {
      const matched =
        normalize(review.content).includes(searchText) ||
        normalize(review.user.fullName).includes(searchText) ||
        normalize(review.book.name).includes(searchText);
      if (!matched) {
        return false;
      }
    }

    const createdAtTime = new Date(review.createdAt).getTime();
    return createdAtTime >= fromTime && createdAtTime <= toTime;
  });

  records.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const totalItems = records.length;
  const start = (filters.page - 1) * filters.limit;
  const end = start + filters.limit;

  return {
    data: records.slice(start, end),
    pagination: toPagination(totalItems, filters.page, filters.limit),
  };
}

export function getMockReviewDetail(reviewId: string): ReviewDetail | null {
  const idx = getMockReviewIndexById(reviewId);
  return idx === -1 ? null : mockReviews[idx];
}

export function updateMockReviewStatus(
  reviewId: string,
  payload: UpdateReviewStatusPayload
): ReviewItem | null {
  const idx = getMockReviewIndexById(reviewId);
  if (idx === -1) {
    return null;
  }

  const updated: ReviewDetail = {
    ...mockReviews[idx],
    status: payload.status as ReviewStatus,
    moderationNote: payload.moderationNote,
    updatedAt: new Date().toISOString(),
  };
  mockReviews[idx] = updated;
  return updated;
}

export function deleteMockReviewById(reviewId: string): boolean {
  const idx = getMockReviewIndexById(reviewId);
  if (idx === -1) {
    return false;
  }

  mockReviews.splice(idx, 1);
  mockReviewIndexById = buildMockReviewIndex(mockReviews);
  return true;
}

export function getMockReviewStats(): ReviewStats {
  const summary = mockReviews.reduce(
    (acc, review) => {
      acc.totalReviews += 1;
      acc.ratingSum += review.rating;
      if (review.status === "pending") acc.pendingReviews += 1;
      if (review.status === "approved") acc.approvedReviews += 1;
      if (review.status === "hidden") acc.hiddenReviews += 1;
      if (review.rating <= 2) acc.lowRatingReviews += 1;
      return acc;
    },
    {
      totalReviews: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      hiddenReviews: 0,
      lowRatingReviews: 0,
      ratingSum: 0,
    }
  );

  return {
    totalReviews: summary.totalReviews,
    pendingReviews: summary.pendingReviews,
    approvedReviews: summary.approvedReviews,
    hiddenReviews: summary.hiddenReviews,
    lowRatingReviews: summary.lowRatingReviews,
    averageRating: summary.totalReviews === 0 ? 0 : summary.ratingSum / summary.totalReviews,
  };
}
