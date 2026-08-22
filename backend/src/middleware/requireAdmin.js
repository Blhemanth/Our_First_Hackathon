/**
 * Middleware: requireAdmin
 * Must run AFTER requireAuth middleware.
 * Verifies that req.user.role === 'admin'. Returns 403 HTTP status if not.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  return next();
}

module.exports = requireAdmin;
