const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

/**
 * GET /api/users/me
 * Returns current authenticated user's profile record
 */
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

/**
 * GET /api/users
 * Returns list of all employee/user records (Admin only)
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, employee_id, name, email, role, phone, address, profile_picture_url, job_title, salary, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Server error fetching users' });
  }
});

/**
 * GET /api/users/:id
 * Returns a specific user profile by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    // Non-admin users can only view their own profile
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied: You can only view your own profile' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error fetching user details' });
  }
});

module.exports = router;
