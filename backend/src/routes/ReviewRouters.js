import express from 'express';
import { auth } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import { checkEmptyBody } from '../middlewares/checkEmptyBody.js';
import {
  canReview,
  createMyReview,
  deleteAdminReview,
  deleteMyReview,
  getMyReviewDetail,
  getMyReviews,
  getPublicBookReviewStats,
  getPublicBookReviews,
  getAdminReviewDetail,
  getAdminReviews,
  getAdminReviewStats,
  updateMyReview,
  updateAdminReviewStatus,
} from '../controllers/ReviewController.js';

const router = express.Router();

//  API XEM ĐÁNH GIÁ (KHÔNG CẦN ĐĂNG NHẬP)
router.get('/books/:bookId', getPublicBookReviews); // Xem danh sách đánh giá của 1 cuốn sách
router.get('/books/:bookId/stats', getPublicBookReviewStats); // Xem thống kê sao (1-5 sao) của 1 cuốn sách

// Các API yêu cầu phải đăng nhập (có token)
router.use(auth);

// API DÀNH CHO khách hàng  
router.get('/can-review', canReview); // Kiểm tra xem user có được phép đánh giá sách này không
router.post('/', checkEmptyBody, createMyReview); 
router.get('/me', getMyReviews); // Xem lịch sử các bài đánh giá của chính mình
router.get('/me/:id', getMyReviewDetail); 
router.put('/me/:id', checkEmptyBody, updateMyReview); 
router.delete('/me/:id', deleteMyReview); 

// Các API yêu cầu quyền Admin
router.use(authorizeRoles('admin'));

// --- API DÀNH CHO ADMIN  ---
router.get('/admin', getAdminReviews); 
router.get('/admin/stats', getAdminReviewStats); // Quản lý: Xem thống kê tổng quan (tổng review, bao nhiêu chờ duyệt...)
router.get('/admin/:id', getAdminReviewDetail); 
router.put('/admin/:id/status', checkEmptyBody, updateAdminReviewStatus); // Quản lý: Duyệt/Ẩn bài đánh giá (thay đổi status)
router.delete('/admin/:id', deleteAdminReview);

export default router;
