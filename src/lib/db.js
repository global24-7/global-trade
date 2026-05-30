// =============================================
// GLOBAL TRADE — DATA ACCESS LAYER
// localStorage fallback (no Supabase required)
// =============================================
import { DEFAULT_PACKAGES, DEFAULT_PLANS } from './supabase.js'

// ---- tiny localStorage helpers ----
function ls(key) {
  try { return JSON.parse(localStorage.getItem(key)) ?? null } catch { return null }
}
function lsSave(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}
function now() { return new Date().toISOString() }

// ---- seed helpers ----
function seedPackages() {
  const seeded = DEFAULT_PACKAGES.map((p, i) => ({ ...p, id: i + 1, created_at: now() }))
  lsSave('gt_packages', seeded)
  return seeded
}
function seedPlans() {
  const seeded = DEFAULT_PLANS.map((p, i) => ({ ...p, id: i + 1, created_at: now() }))
  lsSave('gt_plans', seeded)
  return seeded
}

// ============================================================
// PACKAGES
// ============================================================
export async function getPackages() {
  const data = ls('gt_packages')
  if (!data || !data.length) return seedPackages()
  return [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

export async function upsertPackage(pkg) {
  const pkgs = ls('gt_packages') || []
  if (pkg.id) {
    const idx = pkgs.findIndex(p => p.id === pkg.id)
    if (idx >= 0) { pkgs[idx] = { ...pkgs[idx], ...pkg }; lsSave('gt_packages', pkgs); return pkgs[idx] }
  }
  const newPkg = { ...pkg, id: Date.now(), created_at: now() }
  pkgs.push(newPkg); lsSave('gt_packages', pkgs); return newPkg
}

export async function deletePackage(id) {
  lsSave('gt_packages', (ls('gt_packages') || []).filter(p => p.id !== id))
}

// ============================================================
// PLANS
// ============================================================
export async function getPlans() {
  const data = ls('gt_plans')
  if (!data || !data.length) return seedPlans()
  return [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

export async function upsertPlan(plan) {
  const plans = ls('gt_plans') || []
  if (plan.id) {
    const idx = plans.findIndex(p => p.id === plan.id)
    if (idx >= 0) { plans[idx] = { ...plans[idx], ...plan }; lsSave('gt_plans', plans); return plans[idx] }
  }
  const newPlan = { ...plan, id: Date.now(), created_at: now() }
  plans.push(newPlan); lsSave('gt_plans', plans); return newPlan
}

export async function deletePlan(id) {
  lsSave('gt_plans', (ls('gt_plans') || []).filter(p => p.id !== id))
}

// ============================================================
// USERS
// ============================================================
export async function getAllUsers() {
  const users = ls('gt_users') || []
  return [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function getUserById(id) {
  const u = (ls('gt_users') || []).find(u => u.id === id)
  if (!u) throw new Error('User not found')
  return u
}

export async function getUserByEmail(email) {
  return (ls('gt_users') || []).find(u => u.email === email.toLowerCase()) || null
}

export async function createUser(user) {
  const users = ls('gt_users') || []
  const existing = users.find(u => u.email === user.email)
  if (existing) throw new Error('Email already registered')
  const newUser = { ...user, id: uuid(), created_at: now() }
  users.push(newUser); lsSave('gt_users', users); return newUser
}

export async function updateUser(id, updates) {
  const users = ls('gt_users') || []
  const idx = users.findIndex(u => u.id === id)
  if (idx < 0) throw new Error('User not found')
  users[idx] = { ...users[idx], ...updates }
  lsSave('gt_users', users)
  return users[idx]
}

export async function updateUserBalance(id, newBalance) {
  return updateUser(id, { wallet_balance: newBalance })
}

// ============================================================
// INVESTMENTS (car packages)
// ============================================================
export async function getUserInvestments(userId) {
  const all = ls('gt_investments') || []
  return all.filter(i => i.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function createInvestment(inv) {
  const all = ls('gt_investments') || []
  const newInv = { ...inv, id: uuid(), created_at: now() }
  all.push(newInv); lsSave('gt_investments', all); return newInv
}

export async function updateInvestment(id, updates) {
  const all = ls('gt_investments') || []
  const idx = all.findIndex(i => i.id === id)
  if (idx < 0) throw new Error('Investment not found')
  all[idx] = { ...all[idx], ...updates }
  lsSave('gt_investments', all)
  return all[idx]
}

// ============================================================
// PLAN INVESTMENTS (timer-based)
// ============================================================
export async function getUserPlanInvestments(userId) {
  const all = ls('gt_plan_investments') || []
  return all.filter(i => i.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function createPlanInvestment(inv) {
  const all = ls('gt_plan_investments') || []
  const newInv = { ...inv, id: uuid(), created_at: now() }
  all.push(newInv); lsSave('gt_plan_investments', all); return newInv
}

export async function updatePlanInvestment(id, updates) {
  const all = ls('gt_plan_investments') || []
  const idx = all.findIndex(i => i.id === id)
  if (idx < 0) throw new Error('Plan investment not found')
  all[idx] = { ...all[idx], ...updates }
  lsSave('gt_plan_investments', all)
  return all[idx]
}

// ============================================================
// TRANSACTIONS
// ============================================================
export async function getUserTransactions(userId, limit = 30) {
  const all = ls('gt_transactions') || []
  return all.filter(t => t.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit)
}

export async function createTransaction(tx) {
  const all = ls('gt_transactions') || []
  const newTx = { ...tx, id: uuid(), created_at: now() }
  all.push(newTx); lsSave('gt_transactions', all); return newTx
}

// ============================================================
// DEPOSIT REQUESTS
// ============================================================
export async function getUserDepositRequests(userId) {
  const all = ls('gt_deposit_requests') || []
  return all.filter(d => d.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function getAllPendingDeposits() {
  const all = ls('gt_deposit_requests') || []
  return all.filter(d => d.status === 'pending')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function getAllDepositRequests() {
  const all = ls('gt_deposit_requests') || []
  return [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function createDepositRequest(dep) {
  const all = ls('gt_deposit_requests') || []
  const newDep = { ...dep, id: uuid(), created_at: now() }
  all.push(newDep); lsSave('gt_deposit_requests', all); return newDep
}

export async function updateDepositRequest(id, updates) {
  const all = ls('gt_deposit_requests') || []
  const idx = all.findIndex(d => d.id === id)
  if (idx < 0) throw new Error('Deposit request not found')
  all[idx] = { ...all[idx], ...updates }
  lsSave('gt_deposit_requests', all)
  return all[idx]
}

// ============================================================
// SCREENSHOT UPLOAD (base64 fallback — no Supabase storage)
// ============================================================
export async function uploadScreenshot(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result) // base64 data URL
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ============================================================
// WITHDRAWAL REQUESTS
// ============================================================
export async function createWithdrawalRequest(req) {
  const all = ls('gt_withdrawal_requests') || []
  const newReq = { ...req, id: uuid(), created_at: now() }
  all.push(newReq); lsSave('gt_withdrawal_requests', all); return newReq
}

export async function getAllWithdrawalRequests() {
  const all = ls('gt_withdrawal_requests') || []
  return [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function updateWithdrawalRequest(id, updates) {
  const all = ls('gt_withdrawal_requests') || []
  const idx = all.findIndex(r => r.id === id)
  if (idx < 0) throw new Error('Withdrawal request not found')
  all[idx] = { ...all[idx], ...updates }
  lsSave('gt_withdrawal_requests', all)
  return all[idx]
}

export async function getUserWithdrawalRequests(userId) {
  const all = ls('gt_withdrawal_requests') || []
  return all.filter(r => r.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function getAllInvestments() {
  const all = ls('gt_investments') || []
  return [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}
