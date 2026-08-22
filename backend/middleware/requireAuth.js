import supabase from '../config/supabase.js';

/**
 * requireAuth middleware
 *
 * Verifies the Supabase JWT from the Authorization header.
 * On success, attaches the full `users` table row to req.user.
 * Returns 401 if the token is missing, invalid, or the user has no DB record.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // Fetch the full user record from the public users table
    const { data: userRecord, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (dbError || !userRecord) {
      // No profile row found — auto-create one from JWT metadata so FK constraints work
      const meta = authData.user.user_metadata || {};
      const newProfile = {
        id: authData.user.id,
        email: authData.user.email,
        name: meta.name || authData.user.email.split('@')[0],
        employee_id: meta.employee_id || `EMP-${authData.user.id.slice(0, 6).toUpperCase()}`,
        role: meta.role || 'employee',
      };

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .upsert([newProfile], { onConflict: 'id' })
        .select()
        .single();

      if (insertError) {
        console.error('[requireAuth] Failed to auto-create user profile:', insertError.message);
        // Still allow the request through with metadata — some routes don't need DB row
        req.user = newProfile;
      } else {
        req.user = inserted;
      }
    } else {
      req.user = userRecord;
    }

    next();
  } catch (err) {
    console.error('[requireAuth] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export default requireAuth;
