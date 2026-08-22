import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Helper function for making authenticated fetch requests to the Express backend.
 * Automatically attaches Authorization: Bearer <token> header from Supabase session.
 */
export async function apiFetch(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}: Request failed`);
  }

  return data;
}
