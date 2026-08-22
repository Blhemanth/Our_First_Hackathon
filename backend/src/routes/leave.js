const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

/**
 * GET /api/leave
 * Returns leave requests for authenticated user (or all if admin)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('leave_requests').select('*, users(name, employee_id)');

    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: leaves, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ leaves: leaves || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error fetching leave requests' });
  }
});

/**
 * POST /api/leave
 * Submit a new leave request placeholder endpoint
 */
router.post('/', requireAuth, async (req, res) => {
  return res.json({ message: 'Leave request submission endpoint ready for teammate implementation' });
});

/**
 * PATCH /api/leave/:id/status
 * Admin approve/reject leave request placeholder endpoint
 */
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  return res.json({ message: 'Leave request status update endpoint ready for teammate implementation' });
});

module.exports = router;
