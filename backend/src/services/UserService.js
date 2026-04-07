import User from '../models/User.js';
import { ErrorResponse } from '../utils/error.js';

export async function createUserService(data) {

  return User.create(data);
}

export async function updateUserService(targetUserId, data, currentUserId) {
  // Kiểm tra xem người thực hiện là admin không
  const currentUser = await User.findById(currentUserId);
  const isAdmin = currentUser?.role === 'admin';

  // Nếu có thay đổi role mà không phải admin thì cấm
  if (data.role && !isAdmin) {
    throw new ErrorResponse("Bạn không có quyền thay đổi vai trò", 403);
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new ErrorResponse("Người dùng không tồn tại", 404);
  }
  return User.findByIdAndUpdate(targetUserId, data, { new: true });
}

export async function deleteUserService(targetUserId, currentUserId) {
  if (targetUserId.toString() === currentUserId.toString()) {
    throw new ErrorResponse("Bạn không thể xóa chính mình", 403);
  }
  const user = await User.findById(targetUserId);
  if (!user) {
    throw new ErrorResponse("Người dùng không tồn tại", 404);
  }
  if (user.role === "admin") {
    throw new ErrorResponse("Không thể xóa tài khoản admin", 403);
  }
  return User.findByIdAndDelete(targetUserId);
}

export async function getUserByIdService(userId) {
  return User.findById(userId);
}

export async function getAllUsersService() {
  return User.find();
}