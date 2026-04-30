import { createClient } from '@supabase/supabase-js'

// This file is the single source of truth for all Supabase-related setup.
// If login, table access, or environment variables stop working, start debugging here.

const normalizeSupabaseUrl = (url) => {
  if (!url) return ''

  // Users sometimes paste the REST endpoint from Supabase (`.../rest/v1/`).
  // The JS client wants the project base URL instead (`https://project.supabase.co`),
  // so we normalize it here to avoid breaking auth and queries.
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
}

// Base project URL used by the Supabase JS client.
export const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)

// Public anon key used by the browser client.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Name of the table the dashboard reads from.
// This defaults to `submissions` if you do not provide VITE_SUPABASE_TABLE.
export const supabaseTable = import.meta.env.VITE_SUPABASE_TABLE || 'submissions'

// Optional list of allowed admin emails.
// Example:
// VITE_ADMIN_EMAILS=admin@example.com,doctor@example.com
// If this list is empty, any valid Supabase Auth user can sign in.
export const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

// Simple flag used by the app to decide whether to show the setup screen
// or continue into the auth / dashboard experience.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Real client when config exists, fallback stub when config is missing.
// The fallback prevents the app from crashing and gives readable errors instead.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // Auth fallback:
      // There is NO hardcoded login/password in this project.
      // Real login credentials must come from a user you create inside Supabase Auth.
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
          ),
        }),
        resetPasswordForEmail: async () => ({
          data: null,
          error: new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
          ),
        }),
        signOut: async () => ({ error: null }),
      },

      // Database fallback:
      // This mimics the chained `.from(...).select(...).order(...)` call shape
      // used by the dashboard so the UI can fail gracefully.
      from() {
        return {
          select() {
            return {
              order: async () => ({
                data: null,
                error: new Error(
                  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
                ),
              }),
            }
          },
        }
      },
    }
