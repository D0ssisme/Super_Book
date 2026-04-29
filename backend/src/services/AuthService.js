import User from '../models/User.js';
import { comparePassword } from '../helper/hashPassword.js';
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  generateToken,
  verifyEmailToken,
  verifyPasswordResetToken
} from '../utils/jwt.js';
import { ErrorResponse } from '../utils/error.js';
import { toUserResponse } from '../mappers/UserMapper.js';
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail, sendVerificationEmail } from './mail.service.js';
import { client } from '../config/clientgoogle.config.js';
import { v4 as uuidv4 } from 'uuid';

export const registerService = async (userData) => {
  // Input validation - kiểm tra dữ liệu đầu vào
  const errors = [];
  
  // Trim all inputs
  const fullName = userData.fullName?.trim() || "";
  const username = userData.username?.trim() || "";
  const email = userData.email?.trim().toLowerCase() || "";
  const phone = userData.phone?.trim() || "";
  const password = userData.password || "";
  const confirmPassword = userData.confirmPassword || "";

  // Check required fields
  if (!fullName) errors.push({ field: "fullName", code: "REQUIRED", message: "Họ và tên không được để trống" });
  if (!username) errors.push({ field: "username", code: "REQUIRED", message: "Tên đăng nhập không được để trống" });
  if (!email) errors.push({ field: "email", code: "REQUIRED", message: "Email không được để trống" });
  if (!phone) errors.push({ field: "phone", code: "REQUIRED", message: "Số điện thoại không được để trống" });
  if (!password) errors.push({ field: "password", code: "REQUIRED", message: "Mật khẩu không được để trống" });
  if (!confirmPassword) errors.push({ field: "confirmPassword", code: "REQUIRED", message: "Nhập lại mật khẩu không được để trống" });

  // Check password match
  if (password !== confirmPassword) {
    errors.push({ field: "confirmPassword", code: "MISMATCH", message: "Mật khẩu không khớp" });
  }

  // Block admin username
  if (username.toLowerCase() === "admin") {
    errors.push({ field: "username", code: "RESERVED", message: "Tên đăng nhập không được phép" });
  }

  // Return all validation errors if any
  if (errors.length > 0) {
    throw new ErrorResponse("Validation failed", 400, undefined, errors);
  }

  // Use sanitized data
  const existing = await User.find({
    $or: [
      { username: username },
      { email: email },
      { phone: phone }
    ]
  });
  if (existing) {
    const duplicateErrors = [];
    existing.forEach(user => {
      if (user.username === username)
        duplicateErrors.push({ field: "username", code: "USERNAME_EXISTS", message: "Tài khoản đã tồn tại" });
      if (user.email === email)
        duplicateErrors.push({ field: "email", code: "EMAIL_EXISTS", message: "Email đã tồn tại" });
      if (user.phone === phone)
        duplicateErrors.push({ field: "phone", code: "PHONE_EXISTS", message: "Số điện thoại đã tồn tại" });
    });

    if (duplicateErrors.length > 0) {
      throw new ErrorResponse("Validation failed", 400, undefined, duplicateErrors);
    }
  }

  const user = new User({
    fullName: fullName,
    username: username,
    email: email,
    phone: phone,
    password: password
  });
  await user.save();

  const UserResponse = toUserResponse(user);
  const token = generateToken(UserResponse);
  return { UserResponse, token };
};

export const loginService = async (username, password) => {
  // Input validation - kiểm tra dữ liệu đầu vào
  const sanitizedUsername = username?.trim() || "";
  const sanitizedPassword = password || "";

  if (!sanitizedUsername) {
    throw new ErrorResponse('Tên đăng nhập không được để trống', 400, 'EMPTY_USERNAME');
  }
  if (!sanitizedPassword) {
    throw new ErrorResponse('Mật khẩu không được để trống', 400, 'EMPTY_PASSWORD');
  }

  const user = await User.findOne({
    $or: [{ username: sanitizedUsername }, { email: sanitizedUsername.toLowerCase() }, { phone: sanitizedUsername}]
  });
  if (!user) {
    throw new ErrorResponse('Tài khoản không tồn tại', 401, 'USER_NOT_FOUND');
  }
  const isMatch = await comparePassword(sanitizedPassword, user.password);
  if (!isMatch) {
    throw new ErrorResponse('Mật khẩu không đúng', 401, 'INVALID_PASSWORD');
  }
  const UserResponse = toUserResponse(user);
  const token = generateToken(UserResponse);
  return { UserResponse, token };
};
export const verifyEmailService = async (token) => {
  const decoded = verifyEmailToken(token)
  if (!decoded) {
    throw new ErrorResponse('Invalid token', 401);
  }
  const user = await User.findById(decoded.userId);
  if (!user){
    throw new ErrorResponse('User not found', 404);
  }
  if (user.email !== decoded.email){
    throw new ErrorResponse('Token email mismatch', 401);
  }
  if (user.isVerified){
    throw new ErrorResponse('Email already verified', 400);
  }
  user.isVerified = true;
  await user.save();
  const UserResponse = toUserResponse(user);
  const authToken = generateToken(UserResponse);
  return { UserResponse , token: authToken };
};

export const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email: email });
  if(!user){
    return {  success: true } // luôn trả true để tăng bảo mật tránh cho hacker biết email có tồn tại không
  }
  const now = new Date()
  const lastSent = user.lastPasswordResetSent;
  if (lastSent && now - lastSent < 60 * 1000) { // 1p
    throw new ErrorResponse('Please wait 1 minute before requesting another password reset', 429);
  }
  const resetToken = generatePasswordResetToken(user)
  user.lastPasswordResetSent = now
  await user.save();
  await sendPasswordResetEmail(user, resetToken) //fe xem them trong mail template co href chuyen huong
  return { success: true };
}
export const resetPasswordService = async (token, newPassword) => {
  const decoded = verifyPasswordResetToken(token)
  if (!decoded) {
    throw new ErrorResponse('Invalid token', 401);
  }
  const user = await User.findById(decoded.userId);
  if (!user){
    throw new ErrorResponse('User not found', 404);
  }
  if (user.email !== decoded.email){
    throw new ErrorResponse('Token email mismatch', 401);
  }
  user.password = newPassword;
  await user.save();
  await sendPasswordResetSuccessEmail(user)
  return {  success: true}
}
export const resendVerificationService = async (email) => {
  const user = await User.findOne({ email: email });
  if (!user){
    throw new ErrorResponse('User not found', 404);
  }
  if (user.isVerified){
    throw new ErrorResponse('Email already verified', 400);
  }
  const now = new Date()
  const lastSent = user.lastVerificationSent;
  if (lastSent && now - lastSent < 60 * 1000){ // 1 phut
    throw new ErrorResponse('Please wait 1 minute before requesting another verification email', 429);
  }
  const verificationToken = generateEmailVerificationToken(user)
  user.lastVerificationSent = now
  await user.save();
  await sendVerificationEmail(user, verificationToken)
  return { success: true };
}
//change password after login
export const changePasswordService = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user){
    throw new ErrorResponse('Người dùng không tồn tại', 404);
  }
  const isMatch = await comparePassword(oldPassword, user.password);
  if (!isMatch) {
    throw new ErrorResponse('Mật khẩu cũ không đúng', 401);
  }
  user.password = newPassword;
  await user.save();
  return {  success: true}
}
export const getProfileService = async (username) => {
  const user = await User.findOne({username: username});
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }
  return { fullName: user.fullName,username: user.username, email: user.email, phone: user.phone, id: user._id, role: user.role };
};
export const updateProfileService = async (userId, updateData) => {
  const user = await User.findById(userId)
  if (!user){
    throw new ErrorResponse('Người dùng không tồn tại', 404);
  }
  // check email/username/phone có tồn tại trong thằng user khác không
  if (updateData.email && updateData.email !== user.email){
    const existingEmail = await User.findOne({
      email: updateData.email,
      _id: { $ne: userId } //not equal
    })
    if (existingEmail) {
      throw new ErrorResponse('Email đã tồn tại', 400);
    }
  }
  if (updateData.username && updateData.username !== user.username){
    const existingUsername = await User.findOne({
      username: updateData.username,
      _id: { $ne: userId } //not equal
    })
    if (existingUsername) {
      throw new ErrorResponse('Tên đăng nhập đã tồn tại', 400 )
    }
  }
  if (updateData.phone && updateData.phone !== user.phone){
    const existingPhone = await User.findOne({
      phone: updateData.phone,
      _id: { $ne: userId } //not equal
    })
    if (existingPhone) {
      throw new ErrorResponse('Số điện thoại đã tồn tại', 400)
    }
  }

  // Cập nhật thông tin
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      user[key] = updateData[key]; //Ex: user.customerId = updateData.customerId
    }
  });
  await user.save();
  const UserResponse = toUserResponse(user);
  return { UserResponse };
}

export const googleLoginService = async (code) => {
  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = await ticket.getPayload();
  let user = await User.findOne({ email: payload.email });
  const username = await uuidv4();
  const password = uuidv4();
  if (!user) {
    user = new User({
      fullName: payload.name,
      username: username,
      email: payload.email,
      isVerified: payload.email_verified,
      password: password
    });
    await user.save();
  }
  const UserResponse = toUserResponse(user);
  const token = generateToken(toUserResponse(user));
  return { UserResponse, token };
};