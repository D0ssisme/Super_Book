import Review from '../models/Review.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import OrderDetail from '../models/OrderDetail.js';
//các trạng thái của review: pending (đang chờ duyệt), approved (đã được duyệt và hiển thị công khai), hidden (bị ẩn do không đạt yêu cầu)
const ALLOWED_REVIEW_STATUSES = ['pending', 'approved', 'hidden'];
// Các trạng thái đơn hàng đủ điều kiện để được phép đánh giá sách: delivery (đang giao) hoặc completed (hoàn thành)
const ELIGIBLE_ORDER_STATUSES = ['delivery', 'completed'];

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Hàm chuẩn hóa dữ liệu Review từ Database (MongoDB) sang định dạng JSON gọn gàng, an toàn trả về cho Frontend (Client)
// Hàm này giúp che giấu bớt những trường dư thừa trong DB và đảm bảo Object trả về luôn có cấu trúc đồng nhất
function mapReviewToResponse(review) {
  const user = review.userId;
  const book = review.bookId;
  const order = review.orderId;

  return {
    _id: review._id,
    rating: review.rating,
    content: review.content,
    status: review.status,
    moderationNote: review.moderationNote,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: {
      _id: user?._id || '',
      fullName: user?.fullName || 'Unknown User',
      email: user?.email || '',
    },
    book: {
      _id: book?._id || '',
      name: book?.name || 'Unknown Book',
      imageUrl: Array.isArray(book?.imageUrl) ? book.imageUrl : [],
      category: book?.categoryId?.name || undefined,
      mainImage: Array.isArray(book?.imageUrl) && book.imageUrl.length > 0 ? book.imageUrl[0] : undefined,
    },
    order: order
      ? {
          _id: order._id,
          purchaseDate: order.purchaseDate,
        }
      : undefined,
    images: Array.isArray(review.images) ? review.images : [],
  };
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => (typeof img === 'string' ? img.trim() : ''))
    .filter(Boolean);
}

function parseRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error('Invalid review rating');
  }
  return rating;
}

// Tự động tìm tất cả các ID đơn hàng mà cuốn sách này có trong chi tiết để giúp người dùng khi họ không truyền orderId lên
async function getEligibleOrderIdsForBook(bookId) {
  const orderDetails = await OrderDetail.find({ bookId }).select('orderId').lean();
  return [...new Set(orderDetails.map((d) => d.orderId?.toString()).filter(Boolean))];
}
// chức năng khách hàng 
// khách hàng tạo một đánh giá mới cho sách đã mua. 
export async function createMyReviewService(userId, payload) {
   
  //  Phải truyền bookId (sách cần đánh giá) và sao đánh giá (rating từ 1 -> 5)
  const { bookId, orderId } = payload || {};
  const rating = parseRating(payload?.rating);
  const content = typeof payload?.content === 'string' ? payload.content.trim() : '';
  const images = normalizeImages(payload?.images);

  if (!bookId) {
    throw new Error('Book is required');
  }

  const book = await Book.findById(bookId).lean();
  if (!book) {
    throw new Error('Book not found');
  }

  let selectedOrderId = orderId;
  if (selectedOrderId) {
    // TRƯỜNG HỢP user truyền cụ thể mã đơn hàng (orderId) vào
    //  Đơn hàng phải do chính user này đặt (customerId: userId)
    //  Trạng thái ĐƠN HÀNG (purchaseStatus) phải là: "delivery" (đang giao) hoặc "completed" (hoàn thành)
    // Không cókiểm tra trạng thái thanh toán (chưa thanh toán hay đã thanh toán đều được)
    const order = await Order.findOne({
      _id: selectedOrderId,
      customerId: userId,
      purchaseStatus: { $in: ELIGIBLE_ORDER_STATUSES },
    }).lean();

    if (!order) {
      throw new Error('Order not found or not eligible for review');
    }

    //  Cuốn sách đang đánh giá phải nằm trong đơn hàng này
    const orderDetail = await OrderDetail.findOne({ orderId: selectedOrderId, bookId }).lean();
    if (!orderDetail) {
      throw new Error('Book does not belong to this order');
    }
  } else {
    // TRƯỜNG HỢP  không truyền mã đơn hàng, hệ thống tự quét các đơn để tìm đơn tương ứng.
    const eligibleOrderIds = await getEligibleOrderIdsForBook(bookId);
    if (eligibleOrderIds.length === 0) {
      throw new Error('You have not purchased this book');
    }

    // Lấy tất cả các đơn hàng của user đã mua sách này và đủ điều kiện trạng thái (đang giao/hoàn thành)
    const orders = await Order.find({
      _id: { $in: eligibleOrderIds },
      customerId: userId,
      purchaseStatus: { $in: ELIGIBLE_ORDER_STATUSES },
    })
      .select('_id purchaseDate')
      .sort({ purchaseDate: -1 })
      .lean();

    if (orders.length === 0) {
      throw new Error('You have not purchased this book');
    }

    const reviewed = await Review.find({
      userId,
      bookId,
      orderId: { $in: orders.map((o) => o._id) },
    })
      .select('orderId')
      .lean();

    const reviewedOrderIds = new Set(reviewed.map((r) => r.orderId?.toString()).filter(Boolean));
    // Lấy ra đơn hàng mua sách này mà chưa từng được chính user này đánh giá 
    const availableOrder = orders.find((o) => !reviewedOrderIds.has(o._id.toString()));

    if (!availableOrder) {
      throw new Error('You already reviewed this purchased book');
    }

    selectedOrderId = availableOrder._id;
  }


  const existing = await Review.findOne({ userId, bookId, orderId: selectedOrderId }).lean();
  if (existing) {
    throw new Error('Review already exists for this order');
  }

  const created = await Review.create({
    userId,
    bookId,
    orderId: selectedOrderId,
    rating,
    content,
    images,
    status: 'pending',
    moderationNote: '',
  });

  const review = await Review.findById(created._id)
    .populate('userId', 'fullName email')
    .populate({ path: 'bookId', select: 'name imageUrl categoryId', populate: { path: 'categoryId', select: 'name' } })
    .populate('orderId', 'purchaseDate')
    .lean();

  return mapReviewToResponse(review);
}


// Lấy danh sách review mà chính khách hàng này đã tạo
export async function getMyReviewsService(userId, query = {}) {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, 10), 100);
  const filter = { userId };

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  const [totalItems, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .populate('userId', 'fullName email')
      .populate({ path: 'bookId', select: 'name imageUrl categoryId', populate: { path: 'categoryId', select: 'name' } })
      .populate('orderId', 'purchaseDate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: reviews.map(mapReviewToResponse),
    pagination: {
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      currentPage: page,
      limit,
      hasNext: page * limit < totalItems,
      hasPrev: page > 1,
    },
  };
}

// Xem chi tiết 1 bài đánh giá của bản thân
export async function getMyReviewDetailService(userId, reviewId) {
  const review = await Review.findOne({ _id: reviewId, userId })
    .populate('userId', 'fullName email')
    .populate({ path: 'bookId', select: 'name imageUrl categoryId', populate: { path: 'categoryId', select: 'name' } })
    .populate('orderId', 'purchaseDate')
    .lean();

  if (!review) {
    throw new Error('Review not found');
  }

  return mapReviewToResponse(review);
}

// Chỉnh sửa bài đánh giá: nội dung, sao, hình ảnh; Tự chuyển về trạng thái 'pending' để duyệt lại
export async function updateMyReviewService(userId, reviewId, payload) {
  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) {
    throw new Error('Review not found');
  }

  if (payload.rating !== undefined) {
    review.rating = parseRating(payload.rating);
  }

  if (payload.content !== undefined) {
    review.content = typeof payload.content === 'string' ? payload.content.trim() : '';
  }

  if (payload.images !== undefined) {
    review.images = normalizeImages(payload.images);
  }

  // User chỉnh sửa review thì quay về pending để admin duyệt lại.
  review.status = 'pending';
  review.moderationNote = '';

  await review.save();

  const updated = await Review.findById(review._id)
    .populate('userId', 'fullName email')
    .populate({ path: 'bookId', select: 'name imageUrl categoryId', populate: { path: 'categoryId', select: 'name' } })
    .populate('orderId', 'purchaseDate')
    .lean();

  return mapReviewToResponse(updated);
}

// Xóa bài đánh giá do mình đã đăng
export async function deleteMyReviewService(userId, reviewId) {
  const deleted = await Review.findOneAndDelete({ _id: reviewId, userId });
  if (!deleted) {
    throw new Error('Review not found');
  }
}

// Kiểm tra quyền: xem người dùng đã thanh toán xong đơn hay đã nhận hàng để đc phép vote sao cho sách này chưa
export async function canReviewService(userId, query = {}) {
  const { bookId, orderId } = query;
  if (!bookId) {
    throw new Error('bookId is required');
  }

  const book = await Book.findById(bookId).lean();
  if (!book) {
    throw new Error('Book not found');
  }

  if (orderId) {
    const order = await Order.findOne({
      _id: orderId,
      customerId: userId,
      purchaseStatus: { $in: ELIGIBLE_ORDER_STATUSES },
    }).lean();

    if (!order) {
      return { canReview: false, reason: 'Order not found or not eligible' };
    }

    const detail = await OrderDetail.findOne({ orderId, bookId }).lean();
    if (!detail) {
      return { canReview: false, reason: 'Book does not belong to this order' };
    }

    const existing = await Review.findOne({ userId, bookId, orderId }).lean();
    if (existing) {
      return { canReview: false, reason: 'Review already exists for this order', reviewId: existing._id };
    }

    return { canReview: true, orderId };
  }

  const eligibleOrderIds = await getEligibleOrderIdsForBook(bookId);
  if (eligibleOrderIds.length === 0) {
    return { canReview: false, reason: 'You have not purchased this book' };
  }

  const orders = await Order.find({
    _id: { $in: eligibleOrderIds },
    customerId: userId,
    purchaseStatus: { $in: ELIGIBLE_ORDER_STATUSES },
  })
    .select('_id purchaseDate')
    .sort({ purchaseDate: -1 })
    .lean();

  if (orders.length === 0) {
    return { canReview: false, reason: 'You have not purchased this book' };
  }

  const existingReviews = await Review.find({
    userId,
    bookId,
    orderId: { $in: orders.map((o) => o._id) },
  })
    .select('orderId')
    .lean();

  const reviewedOrderIds = new Set(existingReviews.map((r) => r.orderId?.toString()).filter(Boolean));
  const availableOrder = orders.find((o) => !reviewedOrderIds.has(o._id.toString()));

  if (!availableOrder) {
    return { canReview: false, reason: 'You already reviewed this purchased book' };
  }

  return { canReview: true, orderId: availableOrder._id };
}


// Lấy danh sách đánh giá của 1 cuốn sách (chỉ lấy những bình luận đã được admin duyệt)
export async function getPublicBookReviewsService(bookId, query = {}) {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, 10), 100);
  const filter = { bookId, status: 'approved' };

  if (query.rating && query.rating !== 'all') {
    const rating = Number.parseInt(query.rating, 10);
    if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
      filter.rating = rating;
    }
  }

  const sortKey = typeof query.sort === 'string' ? query.sort : 'newest';
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
  };

  const sort = sortMap[sortKey] || sortMap.newest;

  const [totalItems, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .populate('userId', 'fullName')
      .populate({ path: 'bookId', select: 'name imageUrl categoryId', populate: { path: 'categoryId', select: 'name' } })
      .populate('orderId', 'purchaseDate')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: reviews.map(mapReviewToResponse),
    pagination: {
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      currentPage: page,
      limit,
      hasNext: page * limit < totalItems,
      hasPrev: page > 1,
    },
  };
}

// Lấy tổng quan thống kê (Điểm trung bình, số lượng đánh giá từng sao) của 1 cuốn sách
export async function getPublicBookReviewStatsService(bookId) {
  const book = await Book.findById(bookId).select('_id').lean();
  if (!book) {
    throw new Error('Book not found');
  }

  const [summary] = await Review.aggregate([
    {
      $match: {
        bookId: book._id,
        status: 'approved',
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        r1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        r2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        r3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        r4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        r5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ]);

  if (!summary) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  return {
    averageRating: Number(summary.averageRating || 0),
    totalReviews: summary.totalReviews || 0,
    ratingBreakdown: {
      1: summary.r1 || 0,
      2: summary.r2 || 0,
      3: summary.r3 || 0,
      4: summary.r4 || 0,
      5: summary.r5 || 0,
    },
  };
}

// Tạo bộ lọc filter theo các yêu cầu của quản trị viên: Text User/Email/BookName, Sao, trạng thái đã duyệt
async function buildAdminReviewFilter(filters) {
  const filter = {};

  if (filters.status && filters.status !== 'all') {
    filter.status = filters.status;
  }

  if (filters.rating && filters.rating !== 'all') {
    const rating = Number.parseInt(filters.rating, 10);
    if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
      filter.rating = rating;
    }
  }

  if (filters.fromDate || filters.toDate) {
    const createdAt = {};

    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      if (!Number.isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        createdAt.$gte = from;
      }
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        createdAt.$lte = to;
      }
    }

    if (Object.keys(createdAt).length > 0) {
      filter.createdAt = createdAt;
    }
  }

  const rawSearch = typeof filters.search === 'string' ? filters.search.trim() : '';
  if (rawSearch) {
    const regex = new RegExp(escapeRegex(rawSearch), 'i');

    const [users, books] = await Promise.all([
      User.find({ $or: [{ fullName: regex }, { email: regex }] }).select('_id').lean(),
      Book.find({ name: regex }).select('_id').lean(),
    ]);

    const userIds = users.map((u) => u._id);
    const bookIds = books.map((b) => b._id);

    filter.$or = [{ content: regex }, { userId: { $in: userIds } }, { bookId: { $in: bookIds } }];
  }

  return filter;
}

// chức năng cho admin 

// Lấy danh sách tất cả các đánh giá của các khách hàng
export async function getAdminReviewsService(filters) {
  const page = parsePositiveInt(filters.page, 1);
  const limit = Math.min(parsePositiveInt(filters.limit, 10), 100);
  const filter = await buildAdminReviewFilter(filters);

  const [totalItems, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .populate('userId', 'fullName email')
      .populate({ path: 'bookId', select: 'name imageUrl categoryId', populate: { path: 'categoryId', select: 'name' } })
      .populate('orderId', 'purchaseDate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: reviews.map(mapReviewToResponse),
    pagination: {
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      currentPage: page,
      limit,
      hasNext: page * limit < totalItems,
      hasPrev: page > 1,
    },
  };
}

// Admin mở thông tin chi tiết một đánh giá để theo dõi
export async function getAdminReviewDetailService(reviewId) {
  const review = await Review.findById(reviewId)
    .populate('userId', 'fullName email')
    .populate({ path: 'bookId', select: 'name imageUrl categoryId', populate: { path: 'categoryId', select: 'name' } })
    .populate('orderId', 'purchaseDate')
    .lean();

  if (!review) {
    throw new Error('Review not found');
  }

  return mapReviewToResponse(review);
}

// Admin phê duyệt/từ chối đánh giá, trạng thái: ['pending', 'approved', 'hidden'].
export async function updateAdminReviewStatusService(reviewId, payload) {
  if (!payload?.status || !ALLOWED_REVIEW_STATUSES.includes(payload.status)) {
    throw new Error('Invalid review status');
  }

  const update = { status: payload.status };
  const normalizedNote = typeof payload?.moderationNote === 'string' ? payload.moderationNote.trim() : '';

  // Khi ẩn đánh giá, luôn yêu cầu lý do để khách hàng hiểu nguyên nhân.
  if (payload.status === 'hidden') {
    if (!normalizedNote) {
      throw new Error('moderationNote is required when hiding review');
    }
    update.moderationNote = normalizedNote;
  } else {
    // Trạng thái approved/pending không cần giữ lại lý do ẩn cũ.
    update.moderationNote = '';
  }

  const updated = await Review.findByIdAndUpdate(reviewId, update, { new: true })
    .populate('userId', 'fullName email')
    .populate({ path: 'bookId', select: 'name imageUrl categoryId', populate: { path: 'categoryId', select: 'name' } })
    .populate('orderId', 'purchaseDate')
    .lean();

  if (!updated) {
    throw new Error('Review not found');
  }

  return mapReviewToResponse(updated);
}

// Admin xóa hẳn 1 đánh giá của người dùng ra khỏi cơ sở dữ liệu
export async function deleteAdminReviewService(reviewId) {
  const deleted = await Review.findByIdAndDelete(reviewId);
  if (!deleted) {
    throw new Error('Review not found');
  }
}

// Thống kê % sao, số lượng Review (Pending, Approved, Hidden) đưa vào Dashboard Admin
export async function getAdminReviewStatsService() {
  const [summary] = await Review.aggregate([
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        lowRatingReviews: {
          $sum: {
            $cond: [{ $lte: ['$rating', 2] }, 1, 0],
          },
        },
        pendingReviews: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
          },
        },
        approvedReviews: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, 1, 0],
          },
        },
        hiddenReviews: {
          $sum: {
            $cond: [{ $eq: ['$status', 'hidden'] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (!summary) {
    return {
      totalReviews: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      hiddenReviews: 0,
      averageRating: 0,
      lowRatingReviews: 0,
    };
  }

  return {
    totalReviews: summary.totalReviews || 0,
    pendingReviews: summary.pendingReviews || 0,
    approvedReviews: summary.approvedReviews || 0,
    hiddenReviews: summary.hiddenReviews || 0,
    averageRating: Number(summary.averageRating || 0),
    lowRatingReviews: summary.lowRatingReviews || 0,
  };
}
