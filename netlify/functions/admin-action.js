// netlify/functions/admin-action.js
// Server-side admin operations using the Supabase service role key
// (bypasses Row Level Security for admin tasks)

import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { action, password, payload } = JSON.parse(event.body || '{}')

    // Auth check
    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const supabase = getAdminClient()

    switch (action) {
      case 'approve_deposit': {
        const { dep_id, user_id, amount } = payload
        // Get current balance
        const { data: user } = await supabase.from('users').select('wallet_balance').eq('id', user_id).single()
        const newBal = (user?.wallet_balance || 0) + amount
        await supabase.from('deposit_requests').update({ status: 'approved' }).eq('id', dep_id)
        await supabase.from('users').update({ wallet_balance: newBal }).eq('id', user_id)
        await supabase.from('transactions').insert({
          user_id, type: 'deposit', amount,
          note: 'Manual deposit approved by admin',
          created_at: new Date().toISOString()
        })
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, new_balance: newBal }) }
      }

      case 'reject_deposit': {
        const { dep_id } = payload
        await supabase.from('deposit_requests').update({ status: 'rejected' }).eq('id', dep_id)
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
      }

      case 'adjust_balance': {
        const { user_id, new_balance, reason } = payload
        await supabase.from('users').update({ wallet_balance: new_balance }).eq('id', user_id)
        await supabase.from('transactions').insert({
          user_id, type: 'admin_adjustment', amount: new_balance,
          note: reason || 'Admin balance adjustment',
          created_at: new Date().toISOString()
        })
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
      }

      case 'approve_withdrawal': {
        const { inv_id, user_id, amount } = payload
        await supabase.from('investments').update({ withdrawal_status: 'approved', status: 'completed' }).eq('id', inv_id)
        await supabase.from('transactions').insert({
          user_id, type: 'withdrawal_approved', amount,
          note: 'Withdrawal approved and paid by admin',
          created_at: new Date().toISOString()
        })
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
      }

      default:
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) }
    }
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
