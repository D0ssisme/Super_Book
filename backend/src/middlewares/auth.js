import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";
import { toUserResponse } from "../mappers/UserMapper.js";
export async function auth(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log(`[auth] ${req.method} ${req.path} - Token present: ${!!token}`);

  if (!token) {
    console.log(`[auth] REJECT: No token`);
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    const data = verifyToken(token);
    if (!data || !data.username) {
      console.log(`[auth] REJECT: Invalid or malformed token payload`);
      return res
        .status(401)
        .json({ message: "Not authorized to access this resource" });
    }
    console.log(`[auth] Token verified for user: ${data.username}`);
    const user = await User.findOne({ username: data.username });
    if (!user) {
      console.log(`[auth] REJECT: User not found - ${data.username}`);
      return res.status(401).json({ message: "User not found" });
    }
    if (user.isLocked) {
      console.log(`[auth] REJECT: Locked user - ${data.username}`);
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        message: "Tài khoản của bạn đã bị khóa",
      });
    }
    req.user = toUserResponse(user);
    console.log(
      `[auth] PASS: User authenticated - id: ${req.user.id}, role: ${req.user.role}`,
    );
    next();
  } catch (err) {
    console.log(`[auth] REJECT: Token verification failed - ${err.message}`);
    res.status(401).json({ message: "Not authorized to access this resource" });
  }
}
