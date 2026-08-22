const supabase = require('../config/supabase');

/**
 * requireAuth middleware
 *
 * Verifies the Supabase JWT sent as:
 *   Authorization: Bearer <token>
 *
 * On success: attaches the full `users` table row to req.user
 * On failure: responds 401 Unauthorized
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.split(' ')[1];

  // Verify token with Supabase — works for both access tokens and anon keys
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !authUser) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  // Fetch the full profile row from the public users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ error: 'User profile not found.' });
  }

  req.user = profile; // { id, name, email, role, employee_id, job_title, salary, ... }
  next();
}

module.exports = requireAuth;
