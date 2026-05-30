# 🏆 Global Trade — Investment Platform

A production-grade full-stack React + Vite investment platform with Supabase database, Paystack payments, and Netlify deployment.

---

## 🗂 Project Structure

```
global-trade/
├── index.html                    # Vite entry HTML
├── vite.config.js                # Vite config (code splitting, etc.)
├── netlify.toml                  # Netlify build + redirect + security headers
├── package.json
├── .env.example                  # ← copy to .env and fill in
├── supabase/
│   └── schema.sql                # ← run this in Supabase SQL Editor first
├── netlify/
│   └── functions/
│       ├── verify-payment.js     # Server-side Paystack verification
│       ├── admin-action.js       # Secure admin operations
│       └── paystack-webhook.js   # Paystack webhook handler
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx                   # Router + providers
    ├── index.css                 # Global design system styles
    ├── context/
    │   └── AppContext.jsx        # Global state (user, packages, plans, toast)
    ├── lib/
    │   ├── supabase.js           # Supabase client + seed data
    │   ├── db.js                 # All DB queries (data access layer)
    │   └── utils.js              # Formatting, Paystack helper, constants
    └── components/
        ├── Layout/
        │   ├── Navbar.jsx
        │   └── Footer.jsx
        ├── Auth/
        │   └── AuthModal.jsx     # Login + Register
        ├── Public/
        │   ├── PublicPage.jsx    # Landing page orchestrator
        │   ├── Hero.jsx
        │   ├── AssetCards.jsx    # Car packages showcase
        │   ├── PlanCards.jsx     # Timer plans showcase
        │   └── Features.jsx
        ├── Dashboard/
        │   ├── Dashboard.jsx     # Main user portal (tabs + modals)
        │   ├── InvestmentCard.jsx
        │   └── PlanInvestmentCard.jsx
        ├── Modals/
        │   ├── DepositModal.jsx  # Paystack + Telecel deposit
        │   ├── InvestModal.jsx   # Car package investment
        │   ├── PlanInvestModal.jsx
        │   └── WithdrawModal.jsx
        ├── Admin/
        │   └── AdminPanel.jsx    # Full admin console (hidden, tap×7)
        └── UI/
            ├── Toast.jsx
            └── Loader.jsx
```

---

## 🚀 STEP-BY-STEP SETUP

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `global-trade`, pick a region close to Ghana (e.g. Europe West)
3. Once created, go to **SQL Editor** → paste the entire contents of `supabase/schema.sql` → **Run**
4. Go to **Storage** → **New Bucket**:
   - Name: `screenshots`
   - Make it **Public**
   - Add policy: Allow `anon` role `INSERT` and `SELECT`
5. Go to **Settings → API**:
   - Copy your **Project URL** → `VITE_SUPABASE_URL`
   - Copy your **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - Copy your **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` *(keep secret!)*

---

### Step 2 — Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_dd572e9330e29a4e47eecd9d03c34f26421f0a3a

VITE_MIN_DEPOSIT=50
VITE_ADMIN_FEE_PCT=0.10
VITE_WHATSAPP_NUMBER=233500643544
VITE_TELECEL_1=0505477790
VITE_TELECEL_2=0500643544

# Server-side only (Netlify Functions — no VITE_ prefix)
ADMIN_PASSWORD=kingdevilgh.com
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
```

---

### Step 3 — Install & Run Locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

### Step 4 — Deploy to Netlify

#### Option A — Netlify CLI (Recommended)

```bash
npm install -g netlify-cli
netlify login
netlify init          # Connect or create a new Netlify site
netlify env:import .env   # Push all env vars to Netlify
npm run build         # Test build locally first
netlify deploy --prod
```

#### Option B — GitHub + Netlify Dashboard

1. Push your project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USER/global-trade.git
   git push -u origin main
   ```
2. Go to [netlify.com](https://netlify.com) → **Add New Site** → **Import from GitHub**
3. Select your repo
4. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Go to **Site Settings → Environment Variables** and add **every variable** from your `.env` file
6. Click **Deploy Site**

---

### Step 5 — Configure Paystack Webhook

1. Log into [dashboard.paystack.com](https://dashboard.paystack.com)
2. Go to **Settings → Webhooks**
3. Add webhook URL: `https://YOUR-NETLIFY-SITE.netlify.app/api/paystack-webhook`
4. Select events: `charge.success`

---

### Step 6 — Access the Admin Console

The admin panel is hidden for security. To open it:

1. Log in as any user
2. Rapidly **tap the top-left corner of the screen 7 times**
3. Enter the admin password: `kingdevilgh.com` (or whatever you set in `ADMIN_PASSWORD`)

From the admin panel you can:
- View all users and balances
- Approve or reject Telecel Cash deposit requests
- Add, edit, or disable investment packages
- Add, edit, or disable investment plans

---

## 🔐 Security Features

| Feature | Implementation |
|---|---|
| Security headers | `netlify.toml` (X-Frame-Options, CSP, etc.) |
| Server-side payment verification | `netlify/functions/verify-payment.js` |
| Webhook signature check | HMAC-SHA512 in `paystack-webhook.js` |
| Admin ops via service role | `netlify/functions/admin-action.js` |
| Environment secrets | Never exposed to browser (no `VITE_` prefix) |
| Row Level Security | Enabled on all Supabase tables |
| Hidden admin panel | Tap ×7 gesture — not linked anywhere |

> ⚠️ **Production upgrade recommended:** Replace the custom password auth in `AuthModal.jsx` with [Supabase Auth](https://supabase.com/docs/guides/auth) (email+password) and update RLS policies to use `auth.uid()` for proper per-user data isolation.

---

## 💳 Payment Flow

### Paystack (Card / Mobile Money)
1. User enters amount → Paystack popup opens
2. User pays → Paystack calls `callback` in browser
3. App immediately credits wallet (optimistic)
4. Paystack also fires webhook → `paystack-webhook.js` double-credits if not already done

### Telecel Cash (Manual)
1. User sends money to `0505477790` or `0500643544`
2. User uploads screenshot + enters amount
3. Deposit request saved to `deposit_requests` table with `status: pending`
4. Admin sees it in the Admin Console → approves → wallet credited + transaction logged
5. WhatsApp notification auto-sent to admin

---

## 📊 Database Schema Overview

```
users              → wallet_balance, unique_code, email, password
packages           → luxury car investment configs
investment_plans   → timer-based plan configs
investments        → user car package positions (with withdrawal flow)
plan_investments   → user plan positions (with collect flow)
transactions       → full ledger of all money movements
deposit_requests   → pending Telecel Cash deposits awaiting admin review
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| Auth | Custom (email + password stored in DB) |
| Payments | Paystack (GHS, card + mobile money) |
| Serverless | Netlify Functions (Node.js) |
| Hosting | Netlify |
| Styling | Pure CSS (no Tailwind dependency) |

---

## 📞 Support Contacts (from original config)

- WhatsApp: +233 500 643 544
- Telecel 1: 0505477790
- Telecel 2: 0500643544
