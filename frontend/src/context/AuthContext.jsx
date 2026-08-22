import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch custom profile from `users` table
  const fetchUserProfile = async (userId, fallbackEmail = '') => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.warn('User profile record not found in users table:', error?.message);
        return {
          id: userId,
          email: fallbackEmail,
          role: 'employee',
        };
      }

      return profile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return { id: userId, email: fallbackEmail, role: 'employee' };
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        const profile = await fetchUserProfile(initialSession.user.id, initialSession.user.email);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        const profile = await fetchUserProfile(currentSession.user.id, currentSession.user.email);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign In with Email & Password
   */
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        const profile = await fetchUserProfile(data.user.id, data.user.email);
        setUser(profile);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign Up with Email, Password, Name, Employee ID, and Role
   */
  const signUp = async ({ email, password, name, employee_id, role }) => {
    setLoading(true);
    try {
      // 1. Create Supabase Auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            employee_id,
            role,
          },
        },
      });

      if (authError) throw authError;

      if (data?.user) {
        // 2. Insert corresponding profile row into `users` table
        const newUserProfile = {
          id: data.user.id,
          employee_id,
          name,
          email,
          role: role || 'employee',
          created_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabase
          .from('users')
          .insert([newUserProfile]);

        if (dbError) {
          console.error('Failed to insert record into users table:', dbError.message);
          // Still proceed if RLS or triggers handle it
        }

        setUser(newUserProfile);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
