const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

/**
 * GET /api/attendance
 * Returns attendance logs for authenticated user (or all if admin)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('attendance').select('*, users(name, employee_id)');

    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: attendance, error } = await query.order('date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ attendance: attendance || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error fetching attendance logs' });
  }
});

/**
 * POST /api/attendance/check-in
 * Clock in placeholder endpoint
 */
router.post('/check-in', requireAuth, async (req, res) => {
  return res.json({ message: 'Check-in endpoint ready for teammate implementation' });
});

/**
 * POST /api/attendance/check-out
 * Clock out placeholder endpoint
 */
router.post('/check-out', requireAuth, async (req, res) => {
  return res.json({ message: 'Check-out endpoint ready for teammate implementation' });
});

module.exports = router;
