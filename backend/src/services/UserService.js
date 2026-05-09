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
  const user = await User.findById(userId);
  if (!user) return null;
  const obj = user.toObject();
  obj.isActive = !obj.isLocked;
  return obj;
}

export async function getAllUsersService() {
  const users = await User.find();
  return users.map((u) => {
    const obj = u.toObject();
    obj.isActive = !obj.isLocked;
    return obj;
  });
}

export async function lockUserService(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorResponse("Người dùng không tồn tại", 404);
  }
  if (user.role === "admin") {
    throw new ErrorResponse("Không thể khóa tài khoản admin", 403);
  }
  const updated = await User.findByIdAndUpdate(userId, { isLocked: true }, { new: true });
  const obj = updated.toObject();
  obj.isActive = !obj.isLocked;
  return obj;
}

export async function unlockUserService(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorResponse("Người dùng không tồn tại", 404);
  }
  const updated = await User.findByIdAndUpdate(userId, { isLocked: false }, { new: true });
  const obj = updated.toObject();
  obj.isActive = !obj.isLocked;
  return obj;
}