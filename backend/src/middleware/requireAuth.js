const supabase = require('../config/supabase');

/**
 * Middleware: requireAuth
 * Verifies Supabase JWT from Authorization: Bearer <token> header.
 * Fetches user profile record from `users` table and attaches to req.user.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
    }

    // Verify token with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token', details: authError?.message });
    }

    // Fetch user profile from the `users` table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      // Fallback: attach basic auth user data if DB record not synced yet
      req.user = {
        id: authData.user.id,
        email: authData.user.email,
        role: authData.user.user_metadata?.role || 'employee',
      };
    } else {
      req.user = userProfile;
    }

    req.token = token;
    return next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ error: 'Internal server authentication error' });
  }
}

module.exports = requireAuth;
