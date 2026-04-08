import {
  canReviewService,
  createMyReviewService,
  deleteAdminReviewService,
  deleteMyReviewService,
  getMyReviewDetailService,
  getMyReviewsService,
  getAdminReviewDetailService,
  getAdminReviewsService,
  getAdminReviewStatsService,
  getPublicBookReviewsService,
  getPublicBookReviewStatsService,
  updateMyReviewService,
  updateAdminReviewStatusService,
} from '../services/ReviewService.js';

function toStatusCode(error) {
  const message = (error?.message || '').toLowerCase();
  if (message.includes('already')) return 409;
  if (message.includes('required')) return 400;
  if (message.includes('not found')) return 404;
  if (message.includes('invalid')) return 400;
  return 500;
}


// API DÀNH CHO khách hàng (người mua đánh giá)


// Tạo mới 1 bài đánh giá
export async function createMyReview(req, res) {
  try {
    const data = await createMyReviewService(req.user.id, req.body);
    res.status(201).json({ data });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Lấy danh sách các bài đánh giá do mình viết
export async function getMyReviews(req, res) {
  try {
    const result = await getMyReviewsService(req.user.id, req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Lấy chi tiết 1 bài đánh giá cụ thể của mình
export async function getMyReviewDetail(req, res) {
  try {
    const data = await getMyReviewDetailService(req.user.id, req.params.id);
    res.status(200).json({ data });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Chỉnh sửa bài đánh giá của mình (sau khi sửa sẽ chuyển thành "pending" chờ duyệt lại)
export async function updateMyReview(req, res) {
  try {
    const data = await updateMyReviewService(req.user.id, req.params.id, req.body);
    res.status(200).json({ data });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Xóa bài đánh giá của mình
export async function deleteMyReview(req, res) {
  try {
    await deleteMyReviewService(req.user.id, req.params.id);
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Kiểm tra trước xem user có đủ điều kiện để comment review sách này không
export async function canReview(req, res) {
  try {
    const data = await canReviewService(req.user.id, req.query);
    res.status(200).json({ data });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}



// Lấy danh sách đánh giá của 1 cuốn sách (để hiển thị lên trang chi tiết sách)
export async function getPublicBookReviews(req, res) {
  try {
    const result = await getPublicBookReviewsService(req.params.bookId, req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Thống kê % sao rating cho cuốn sách đó
export async function getPublicBookReviewStats(req, res) {
  try {
    const data = await getPublicBookReviewStatsService(req.params.bookId);
    res.status(200).json({ data });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}


// API DÀNH CHO ADMIN 

// Lấy toàn bộ danh sách đánh giá trong hệ thống (có kèm bộ lọc trạng thái, tên user...)
export async function getAdminReviews(req, res) {
  try {
    const result = await getAdminReviewsService(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Lấy chi tiết 1 bài đánh giá bất kỳ
export async function getAdminReviewDetail(req, res) {
  try {
    const data = await getAdminReviewDetailService(req.params.id);
    res.status(200).json({ data });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Phê duyệt hoặc Ẩn đánh giá vi phạm (đổi status)
export async function updateAdminReviewStatus(req, res) {
  try {
    const data = await updateAdminReviewStatusService(req.params.id, req.body);
    res.status(200).json({ data });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Xóa bài đánh giá của người khác nếu có lỗi nặng
export async function deleteAdminReview(req, res) {
  try {
    await deleteAdminReviewService(req.params.id);
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(toStatusCode(error)).json({ message: error.message });
  }
}

// Thống kê tổng số review, tổng số đang chờ duyệt... hiển thị lên dashboard admin 
export async function getAdminReviewStats(req, res) {
  try {
    const data = await getAdminReviewStatsService();
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
