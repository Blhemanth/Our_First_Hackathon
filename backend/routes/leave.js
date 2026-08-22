import { Router } from 'express';
import supabase from '../config/supabase.js';
import requireAuth from '../middleware/requireAuth.js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leave
// Employee submits a new leave request.
// user_id is derived from the verified JWT — never trusted from the request body.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { leave_type, start_date, end_date, remarks } = req.body;

  // Basic validation
  if (!leave_type || !start_date || !end_date) {
    return res.status(400).json({ error: 'leave_type, start_date, and end_date are required.' });
  }

  const validLeaveTypes = ['paid', 'sick', 'unpaid'];
  if (!validLeaveTypes.includes(leave_type)) {
    return res.status(400).json({ error: `leave_type must be one of: ${validLeaveTypes.join(', ')}.` });
  }

  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ error: 'end_date must be on or after start_date.' });
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: req.user.id,
      leave_type,
      start_date,
      end_date,
      remarks: remarks || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/leave] Supabase error:', error);
    return res.status(500).json({ error: 'Failed to create leave request.' });
  }

  return res.status(201).json({ message: 'Leave request submitted successfully.', leave: data });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leave/mine
// Returns all leave requests for the currently authenticated employee.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/leave/mine] Supabase error:', error);
    return res.status(500).json({ error: 'Failed to fetch leave requests.' });
  }

  return res.status(200).json({ leaves: data });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leave/all  [Admin only]
// Returns all leave requests across all employees joined with their name.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  // Supabase join: leave_requests → users (for name, employee_id, job_title)
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      id,
      leave_type,
      start_date,
      end_date,
      remarks,
      status,
      admin_comment,
      created_at,
      user_id,
      users:user_id (
        id,
        name,
        employee_id,
        email,
        job_title
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/leave/all] Supabase error:', error);
    return res.status(500).json({ error: 'Failed to fetch all leave requests.' });
  }

  // Flatten response for easier frontend consumption
  const leaves = data.map((leave) => ({
    ...leave,
    employee_name: leave.users?.name ?? 'Unknown',
    employee_id: leave.users?.employee_id ?? '-',
    employee_email: leave.users?.email ?? '-',
    job_title: leave.users?.job_title ?? '-',
    users: undefined, // strip nested object
  }));

  return res.status(200).json({ leaves });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leave/:id  [Admin only]
// Updates the status (approved | rejected) and optional admin_comment.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, admin_comment } = req.body;

  const validStatuses = ['approved', 'rejected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}.` });
  }

  // Verify the leave request exists and is still pending
  const { data: existing, error: fetchError } = await supabase
    .from('leave_requests')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }

  if (existing.status !== 'pending') {
    return res
      .status(409)
      .json({ error: `Leave request has already been ${existing.status}. Cannot update again.` });
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      admin_comment: admin_comment?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/leave/:id] Supabase error:', error);
    return res.status(500).json({ error: 'Failed to update leave request.' });
  }

  return res.status(200).json({ message: `Leave request ${status} successfully.`, leave: data });
});

export default router;
