/**
 * requireAdmin middleware
 *
 * Must be placed AFTER requireAuth in a route handler chain.
 * Checks that req.user.role === 'admin'.
 *
 * On failure: responds 403 Forbidden
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
}

module.exports = requireAdmin;
