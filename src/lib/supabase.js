// =============================================
// GLOBAL TRADE — Supabase client (optional)
// App runs fully on localStorage if env vars
// are not set — no crash, no errors.
// =============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only initialise Supabase when both vars are present
export let supabase = null
if (supabaseUrl && supabaseKey) {
  const { createClient } = await import('@supabase/supabase-js').catch(() => ({ createClient: null }))
  if (createClient) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
}

// ---- Default seed data ----
export const DEFAULT_PACKAGES = [
  { name: 'Rolls-Royce', invest_amount: 399,  return_amount: 1476.02, duration_days: 9,  roi: '270%', img: 'https://images.unsplash.com/photo-1631295868223-63228b10f6e4?w=600&auto=format', status: 'active' },
  { name: 'Bugatti',     invest_amount: 70,   return_amount: 190.05,  duration_days: 6,  roi: '171%', img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&auto=format', status: 'active' },
  { name: 'Lamborghini', invest_amount: 80,   return_amount: 250,     duration_days: 7,  roi: '212%', img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&auto=format', status: 'active' },
  { name: 'Ferrari',     invest_amount: 60,   return_amount: 180,     duration_days: 6,  roi: '200%', img: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=600&auto=format', status: 'active' },
  { name: 'Pagani',      invest_amount: 110,  return_amount: 349,     duration_days: 6,  roi: '217%', img: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?w=600&auto=format', status: 'active' },
  { name: 'McLaren',     invest_amount: 150,  return_amount: 480,     duration_days: 8,  roi: '220%', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format', status: 'active' },
]

export const DEFAULT_PLANS = [
  { name: 'Starter Plan', invest_amount: 100,  interest_pct: 50,  duration_hours: 12, img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format', status: 'active' },
  { name: 'Silver Plan',  invest_amount: 200,  interest_pct: 60,  duration_hours: 24, img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format', status: 'active' },
  { name: 'Gold Plan',    invest_amount: 500,  interest_pct: 75,  duration_hours: 48, img: 'https://images.unsplash.com/photo-1642790551116-18e4f048a4e0?w=600&auto=format', status: 'active' },
  { name: 'Diamond Plan', invest_amount: 1000, interest_pct: 100, duration_hours: 72, img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format', status: 'active' },
]
