import { Router } from 'express';
import supabase from '../config/supabase.js';
import requireAuth from '../middleware/requireAuth.js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = Router();

// ---------------------------------------------------------------------------
// Fields that employees are allowed to update on their own profile.
// Any other fields in the request body will be stripped server-side.
// ---------------------------------------------------------------------------
const EMPLOYEE_ALLOWED_FIELDS = ['phone', 'address', 'profile_picture_url'];

// Fields that are never writable via the API (managed by auth / system).
const IMMUTABLE_FIELDS = ['id', 'employee_id', 'created_at'];

// ---------------------------------------------------------------------------
// GET /api/users
// Admin only — returns all user records.
// ---------------------------------------------------------------------------
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GET /api/users] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch users.' });
    }

    return res.status(200).json({ users: data });
  } catch (err) {
    console.error('[GET /api/users] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/:id
// Accessible by the user themselves OR an admin.
// ---------------------------------------------------------------------------
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const requestingUser = req.user;

  // Access control: only self or admin
  if (requestingUser.id !== id && requestingUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. You can only view your own profile.' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user: data });
  } catch (err) {
    console.error('[GET /api/users/:id] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/users/:id
// Employees can only update phone, address, profile_picture_url on their own id.
// Admins can update any non-immutable field on any id.
// Field-level enforcement happens server-side regardless of what the client sends.
// ---------------------------------------------------------------------------
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const requestingUser = req.user;
  const isAdmin = requestingUser.role === 'admin';

  // Access control
  if (!isAdmin && requestingUser.id !== id) {
    return res.status(403).json({
      error: 'Forbidden. You can only update your own profile.',
    });
  }

  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }

  // Strip immutable fields from everyone
  let allowedUpdate = Object.fromEntries(
    Object.entries(body).filter(([key]) => !IMMUTABLE_FIELDS.includes(key))
  );

  // For non-admins, further restrict to the allowed employee fields
  if (!isAdmin) {
    allowedUpdate = Object.fromEntries(
      Object.entries(allowedUpdate).filter(([key]) =>
        EMPLOYEE_ALLOWED_FIELDS.includes(key)
      )
    );
  }

  if (Object.keys(allowedUpdate).length === 0) {
    return res.status(400).json({
      error: isAdmin
        ? 'No valid fields provided for update.'
        : `Employees may only update: ${EMPLOYEE_ALLOWED_FIELDS.join(', ')}.`,
    });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(allowedUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/users/:id] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update user.' });
    }

    return res.status(200).json({ user: data });
  } catch (err) {
    console.error('[PATCH /api/users/:id] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
