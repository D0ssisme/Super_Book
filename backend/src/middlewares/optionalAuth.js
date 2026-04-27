import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";
import { toUserResponse } from "../mappers/UserMapper.js";

/**
 * Optional authentication middleware
 * Authenticates user if token is provided, but allows request to proceed without token
 * If no token or invalid token, uses guestSessionId from header
 */
export async function optionalAuth(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  const guestSessionIdFromHeader = req.header("X-Guest-Session-Id");
  
  console.log(`[optionalAuth] ${req.method} ${req.path} - Token present: ${!!token}, GuestSessionId: ${!!guestSessionIdFromHeader}`);

  if (!token) {
    // No token = guest user, use provided session ID or generate new one
    const guestSessionId = guestSessionIdFromHeader || `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    req.guestSessionId = guestSessionId;
    console.log(`[optionalAuth] Guest request - sessionId: ${guestSessionId}`);
    return next();
  }

  try {
    const data = verifyToken(token);
    if (!data || !data.username) {
      console.log(`[optionalAuth] Invalid token payload, treating as guest`);
      const guestSessionId = guestSessionIdFromHeader || `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      req.guestSessionId = guestSessionId;
      return next();
    }

    const user = await User.findOne({ username: data.username });
    if (!user) {
      console.log(`[optionalAuth] User not found, treating as guest`);
      const guestSessionId = guestSessionIdFromHeader || `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      req.guestSessionId = guestSessionId;
      return next();
    }

    req.user = toUserResponse(user);
    console.log(`[optionalAuth] User authenticated - id: ${req.user.id}, role: ${req.user.role}`);
    next();
  } catch (err) {
    console.log(`[optionalAuth] Token verification failed, treating as guest - ${err.message}`);
    const guestSessionId = guestSessionIdFromHeader || `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    req.guestSessionId = guestSessionId;
    next();
  }
}
