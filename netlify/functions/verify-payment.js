// netlify/functions/verify-payment.js
// Server-side Paystack payment verification using the secret key
// Called after a successful client-side Paystack popup to double-verify
import crypto from 'crypto'

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { reference } = JSON.parse(event.body || '{}')
    if (!reference) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Reference required' }) }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Payment service not configured' }) }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    })

    const data = await response.json()

    if (!data.status || data.data?.status !== 'success') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Payment verification failed', details: data.message }) }
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        verified: true,
        amount: data.data.amount / 100, // Convert pesewas → GHS
        reference: data.data.reference,
        email: data.data.customer.email,
      })
    }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) }
  }
}
