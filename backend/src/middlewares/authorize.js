export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Accept both authorizeRoles("admin") and authorizeRoles(["admin"]) safely.
    const normalizedRoles = allowedRoles.flatMap((role) =>
      Array.isArray(role) ? role : [role],
    );

    if (!req.user || !normalizedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
    }
    next();
  }
}