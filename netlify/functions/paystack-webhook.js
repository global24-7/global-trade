// netlify/functions/paystack-webhook.js
// Receives Paystack webhook events (charge.success, etc.)
// Configure this URL in your Paystack dashboard → Settings → Webhooks

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    const hash = crypto
      .createHmac('sha512', secret)
      .update(event.body)
      .digest('hex')

    if (hash !== event.headers['x-paystack-signature']) {
      console.error('Webhook signature mismatch')
      return { statusCode: 401, body: 'Unauthorized' }
    }

    const payload = JSON.parse(event.body)

    if (payload.event === 'charge.success') {
      const { reference, amount, customer, metadata } = payload.data
      const amountGHS = amount / 100
      const userCode = metadata?.custom_fields?.find(f => f.variable_name === 'user_code')?.value

      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Find user by code or email
      const { data: user } = await supabase
        .from('users')
        .select('id, wallet_balance')
        .or(`unique_code.eq.${userCode},email.eq.${customer.email}`)
        .maybeSingle()

      if (user) {
        const newBal = (user.wallet_balance || 0) + amountGHS
        await supabase.from('users').update({ wallet_balance: newBal }).eq('id', user.id)
        await supabase.from('transactions').insert({
          user_id: user.id, type: 'deposit', amount: amountGHS,
          note: `Paystack webhook: ${reference}`,
          created_at: new Date().toISOString()
        })
        console.log(`Credited GHS ${amountGHS} to user ${user.id}`)
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (err) {
    console.error('Webhook error:', err)
    return { statusCode: 500, body: err.message }
  }
}
