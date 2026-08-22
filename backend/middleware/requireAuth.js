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
      return res.status(401).json({ error: 'User record not found.' });
    }

    req.user = userRecord;
    next();
  } catch (err) {
    console.error('[requireAuth] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export default requireAuth;
