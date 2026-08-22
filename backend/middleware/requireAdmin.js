/**
 * requireAdmin middleware
 *
 * Must be used AFTER requireAuth (relies on req.user being set).
 * Returns 403 if the authenticated user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    // Defensive guard — should not happen if requireAuth ran first
    return res.status(401).json({ error: 'Unauthenticated.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  next();
};

export default requireAdmin;
