const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Helper: get today's date string in YYYY-MM-DD (server local date)
function todayDate() {
  return new Date().toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance/checkin
// Creates or upserts today's attendance row with check_in = now, status = 'present'
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkin', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = todayDate();
    const now = new Date().toISOString();

    // Check if a record already exists for today
    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing && existing.check_in) {
      return res.status(400).json({ error: 'Already checked in today.' });
    }

    let result;
    if (existing) {
      // Row exists but no check_in yet — update it
      const { data, error } = await supabase
        .from('attendance')
        .update({ check_in: now, status: 'present' })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // No row yet — insert
      const { data, error } = await supabase
        .from('attendance')
        .insert({ user_id: userId, date: today, check_in: now, status: 'present' })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return res.status(200).json({ message: 'Checked in successfully.', attendance: result });
  } catch (err) {
    console.error('[POST /checkin]', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance/checkout
// Updates today's attendance row with check_out = now
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = todayDate();
    const now = new Date().toISOString();

    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing || !existing.check_in) {
      return res.status(400).json({ error: 'You have not checked in today.' });
    }

    if (existing.check_out) {
      return res.status(400).json({ error: 'Already checked out today.' });
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out: now })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ message: 'Checked out successfully.', attendance: data });
  } catch (err) {
    console.error('[POST /checkout]', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance/mine
// Returns the authenticated user's attendance for the last 7 days
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // inclusive of today = 7 days
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];
    const toDate = todayDate();

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ attendance: data });
  } catch (err) {
    console.error('[GET /mine]', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance/all?date=YYYY-MM-DD
// Admin only — returns all employees' attendance for the given date, joined with user names
// ─────────────────────────────────────────────────────────────────────────────
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'A valid date query parameter (YYYY-MM-DD) is required.' });
    }

    // Join attendance with users to get name, employee_id, job_title
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        check_in,
        check_out,
        status,
        users (
          id,
          name,
          employee_id,
          job_title,
          email
        )
      `)
      .eq('date', date)
      .order('check_in', { ascending: true });

    if (error) throw error;

    // Flatten structure for easy frontend consumption
    const records = (data || []).map((row) => ({
      id: row.id,
      date: row.date,
      check_in: row.check_in,
      check_out: row.check_out,
      status: row.status,
      user_id: row.users?.id,
      name: row.users?.name,
      employee_id: row.users?.employee_id,
      job_title: row.users?.job_title,
      email: row.users?.email,
    }));

    return res.status(200).json({ attendance: records, date });
  } catch (err) {
    console.error('[GET /all]', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

module.exports = router;
