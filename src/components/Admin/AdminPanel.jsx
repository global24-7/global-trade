import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import {
  getAllUsers, getAllPendingDeposits, updateDepositRequest,
  updateUserBalance, createTransaction,
  upsertPackage, deletePackage, upsertPlan, deletePlan,
  getAllWithdrawalRequests, updateWithdrawalRequest, getAllInvestments,
} from '../../lib/db.js'
import { fmtMoney, fmtDate, fmtDateTime, ADMIN_PASSWORD } from '../../lib/utils.js'

const TABS = ['Users', 'Deposits', 'Investments', 'Packages', 'Plans', 'Balance Adjust']

export default function AdminPanel({ onClose }) {
  const { packages, setPackages, plans, setPlans, toast } = useApp()
  const [authed, setAuthed] = useState(false)
  const [pass, setPass] = useState('')
  const [tab, setTab] = useState('Users')
  const [users, setUsers] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [editPkg, setEditPkg] = useState(null)
  const [editPlan, setEditPlan] = useState(null)

  // Balance adjust state
  const [balTarget, setBalTarget] = useState('')
  const [balAmount, setBalAmount] = useState('')
  const [balMode, setBalMode] = useState('add') // add | remove | set
  const [balNote, setBalNote] = useState('')
  const [balLoading, setBalLoading] = useState(false)

  function checkPass(e) {
    e.preventDefault()
    if (pass === ADMIN_PASSWORD) { setAuthed(true); loadAll() }
    else toast('Incorrect admin password', 'error')
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [u, d, w, invs] = await Promise.all([
        getAllUsers(), getAllPendingDeposits(),
        getAllWithdrawalRequests(), getAllInvestments(),
      ])
      setUsers(u)
      setDeposits(d)
      setWithdrawals(w)
      setInvestments(invs)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  async function approveDeposit(dep) {
    try {
      await updateDepositRequest(dep.id, { status: 'approved' })
      const user = users.find(u => u.id === dep.user_id)
      if (user) {
        await updateUserBalance(dep.user_id, (user.wallet_balance || 0) + dep.amount)
        await createTransaction({
          user_id: dep.user_id, type: 'deposit', amount: dep.amount,
          note: `Deposit approved by admin`, created_at: new Date().toISOString()
        })
      }
      toast(`GHS ${dep.amount} deposit approved`, 'success')
      await loadAll()
    } catch (e) { toast(e.message, 'error') }
  }

  async function rejectDeposit(dep) {
    try {
      await updateDepositRequest(dep.id, { status: 'rejected' })
      toast('Deposit rejected', 'success')
      await loadAll()
    } catch (e) { toast(e.message, 'error') }
  }

  async function markWithdrawalPaid(w) {
    try {
      await updateWithdrawalRequest(w.id, { status: 'paid', paid_at: new Date().toISOString() })
      // Update the linked investment as withdrawn
      await createTransaction({
        user_id: w.user_id, type: 'withdrawal_approved', amount: w.amount,
        note: `Withdrawal paid: ${w.package_name}`, created_at: new Date().toISOString()
      })
      toast(`Withdrawal of ${fmtMoney(w.amount)} marked as paid`, 'success')
      await loadAll()
    } catch (e) { toast(e.message, 'error') }
  }

  async function rejectWithdrawal(w) {
    try {
      await updateWithdrawalRequest(w.id, { status: 'rejected' })
      toast('Withdrawal rejected', 'success')
      await loadAll()
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleBalanceAdjust(e) {
    e.preventDefault()
    const query = balTarget.trim().toLowerCase()
    const amount = parseFloat(balAmount)
    if (!query || isNaN(amount) || amount <= 0) return toast('Fill in all fields correctly', 'error')
    const user = users.find(u =>
      u.unique_code?.toLowerCase() === query || u.email?.toLowerCase() === query
    )
    if (!user) return toast('User not found. Check code or email.', 'error')
    setBalLoading(true)
    try {
      const current = user.wallet_balance || 0
      let newBal
      if (balMode === 'add') newBal = current + amount
      else if (balMode === 'remove') newBal = Math.max(0, current - amount)
      else newBal = amount
      await updateUserBalance(user.id, newBal)
      await createTransaction({
        user_id: user.id, type: balMode === 'add' ? 'deposit' : 'withdrawal_approved',
        amount,
        note: balNote.trim() || `Manual balance ${balMode} by admin`,
        created_at: new Date().toISOString()
      })
      toast(`Balance updated: ${user.full_name} → ${fmtMoney(newBal)}`, 'success')
      setBalTarget(''); setBalAmount(''); setBalNote('')
      await loadAll()
    } catch (e) { toast(e.message, 'error') }
    setBalLoading(false)
  }

  async function savePackage(pkg) {
    try {
      const saved = await upsertPackage(pkg)
      setPackages(prev => pkg.id
        ? prev.map(p => p.id === pkg.id ? saved : p)
        : [...prev, saved])
      setEditPkg(null)
      toast('Package saved', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleDeletePackage(id) {
    if (!confirm('Delete this package?')) return
    try {
      await deletePackage(id)
      setPackages(prev => prev.filter(p => p.id !== id))
      toast('Package deleted', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  async function savePlan(plan) {
    try {
      const saved = await upsertPlan(plan)
      setPlans(prev => plan.id
        ? prev.map(p => p.id === plan.id ? saved : p)
        : [...prev, saved])
      setEditPlan(null)
      toast('Plan saved', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleDeletePlan(id) {
    if (!confirm('Delete this plan?')) return
    try {
      await deletePlan(id)
      setPlans(prev => prev.filter(p => p.id !== id))
      toast('Plan deleted', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.unique_code?.toLowerCase().includes(q)
  })

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending')

  return (
    <div className="admin-overlay">
      <div className="admin-card">
        <div className="admin-header">
          <h3><i className="fas fa-crown" style={{ marginRight: '.5rem' }} /> Admin Console — Global Trade</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <div className="admin-body">
          {!authed ? (
            <form onSubmit={checkPass}>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>🔐 Restricted access. Enter admin password to continue.</p>
              <input type="password" className="input" placeholder="Admin password"
                value={pass} onChange={e => setPass(e.target.value)} autoFocus />
              <button type="submit" className="btn btn-gold btn-block" style={{ borderRadius: 12 }}>Unlock Dashboard</button>
            </form>
          ) : (
            <>
              <div className="admin-tabs" style={{ flexWrap: 'wrap', gap: '.4rem' }}>
                {TABS.map(t => (
                  <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}
                    style={{ position: 'relative' }}>
                    {t}
                    {t === 'Investments' && pendingWithdrawals.length > 0 && (
                      <span style={{
                        background: '#ef4444', color: '#fff', borderRadius: 99,
                        fontSize: '.65rem', fontWeight: 700, padding: '1px 5px',
                        position: 'absolute', top: -4, right: -4
                      }}>{pendingWithdrawals.length}</span>
                    )}
                    {t === 'Deposits' && deposits.length > 0 && (
                      <span style={{
                        background: '#ef4444', color: '#fff', borderRadius: 99,
                        fontSize: '.65rem', fontWeight: 700, padding: '1px 5px',
                        position: 'absolute', top: -4, right: -4
                      }}>{deposits.length}</span>
                    )}
                  </button>
                ))}
                <button className="admin-tab" onClick={loadAll} style={{ marginLeft: 'auto' }}>
                  <i className="fas fa-sync" style={{ marginRight: 4 }} />Refresh
                </button>
              </div>

              {loading && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <span className="spinner" style={{ width: 30, height: 30 }} />
                </div>
              )}

              {/* ===== USERS ===== */}
              {!loading && tab === 'Users' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '.6rem' }}>
                    <p className="text-sm text-muted">{filteredUsers.length} / {users.length} users</p>
                    <input className="input" placeholder="🔍 Search name, email, code…"
                      value={userSearch} onChange={e => setUserSearch(e.target.value)}
                      style={{ maxWidth: 240, padding: '.4rem .8rem', fontSize: '.83rem' }} />
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th><th>Email</th><th>Code</th><th>Balance</th><th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.id}>
                            <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                            <td className="text-muted text-sm">{u.email}</td>
                            <td><code style={{ color: 'var(--gold2)', fontSize: '.78rem' }}>{u.unique_code}</code></td>
                            <td><strong style={{ color: 'var(--gold2)' }}>{fmtMoney(u.wallet_balance)}</strong></td>
                            <td className="text-xs text-muted">{fmtDate(u.created_at)}</td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No users found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===== DEPOSITS ===== */}
              {!loading && tab === 'Deposits' && (
                <div>
                  <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>{deposits.length} pending deposit{deposits.length !== 1 ? 's' : ''}</p>
                  {deposits.length === 0
                    ? <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No pending deposits. 🎉</p>
                    : deposits.map(dep => (
                      <div key={dep.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 14, padding: '1.2rem', marginBottom: '.8rem' }}>
                        <div className="flex-between" style={{ marginBottom: '.5rem' }}>
                          <div>
                            <strong>{dep.user_name}</strong>
                            <span className="text-xs text-muted" style={{ marginLeft: 8 }}>{dep.user_code}</span>
                          </div>
                          <strong style={{ color: 'var(--gold2)', fontSize: '1.1rem' }}>{fmtMoney(dep.amount)}</strong>
                        </div>
                        <div className="text-xs text-muted" style={{ marginBottom: '.7rem' }}>
                          {fmtDateTime(dep.created_at)} · Telecel Cash
                        </div>
                        {dep.screenshot_url && (
                          <a href={dep.screenshot_url} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--blue2)', fontSize: '.82rem', display: 'block', marginBottom: '.7rem' }}>
                            <i className="fas fa-image" style={{ marginRight: 4 }} />View Screenshot
                          </a>
                        )}
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button className="btn btn-green" style={{ borderRadius: 10, padding: '.4rem 1rem', fontSize: '.82rem' }} onClick={() => approveDeposit(dep)}>
                            <i className="fas fa-check" /> Approve
                          </button>
                          <button className="btn btn-red" style={{ borderRadius: 10, padding: '.4rem 1rem', fontSize: '.82rem' }} onClick={() => rejectDeposit(dep)}>
                            <i className="fas fa-times" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* ===== INVESTMENTS / WITHDRAWALS ===== */}
              {!loading && tab === 'Investments' && (
                <div>
                  <h4 style={{ color: 'var(--gold2)', marginBottom: '1rem' }}>
                    Pending Withdrawals
                    {pendingWithdrawals.length > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: '.7rem', fontWeight: 700, padding: '2px 7px', marginLeft: 8 }}>
                        {pendingWithdrawals.length}
                      </span>
                    )}
                  </h4>

                  {pendingWithdrawals.length === 0
                    ? <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '1.5rem' }}>No pending withdrawals. 🎉</p>
                    : pendingWithdrawals.map(w => (
                      <div key={w.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 14, padding: '1.2rem', marginBottom: '.8rem' }}>
                        <div className="flex-between" style={{ marginBottom: '.4rem' }}>
                          <div>
                            <strong>{w.user_name}</strong>
                            <code style={{ fontSize: '.74rem', color: 'var(--gold2)', marginLeft: 8 }}>{w.user_code}</code>
                          </div>
                          <strong style={{ color: 'var(--gold2)' }}>{fmtMoney(w.amount)}</strong>
                        </div>
                        <div className="text-xs text-muted" style={{ marginBottom: '.3rem' }}>
                          Package: {w.package_name} · {fmtDateTime(w.created_at)}
                        </div>
                        <div style={{ background: 'rgba(201,168,76,0.08)', borderRadius: 10, padding: '.6rem .8rem', marginBottom: '.8rem', fontSize: '.83rem' }}>
                          <i className="fas fa-mobile-alt" style={{ color: 'var(--gold2)', marginRight: 6 }} />
                          <strong>{w.network}</strong>: {w.momo_name} · {w.momo_number}
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button className="btn btn-green" style={{ borderRadius: 10, padding: '.4rem 1rem', fontSize: '.82rem' }} onClick={() => markWithdrawalPaid(w)}>
                            <i className="fas fa-check-double" /> Mark Paid
                          </button>
                          <button className="btn btn-red" style={{ borderRadius: 10, padding: '.4rem 1rem', fontSize: '.82rem' }} onClick={() => rejectWithdrawal(w)}>
                            <i className="fas fa-times" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  }

                  <h4 style={{ color: 'var(--muted)', margin: '1.5rem 0 1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>All Investments</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th><th>Package</th><th>Invested</th><th>Return</th><th>Status</th><th>Withdrawal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investments.map(inv => {
                          const wr = withdrawals.find(w => w.investment_id === inv.id)
                          return (
                            <tr key={inv.id}>
                              <td className="text-sm">{inv.user_id?.slice(0, 8)}…</td>
                              <td style={{ fontWeight: 600 }}>{inv.package_name}</td>
                              <td>{fmtMoney(inv.invest_amount)}</td>
                              <td style={{ color: 'var(--gold2)' }}>{fmtMoney(inv.return_amount)}</td>
                              <td><span className={`chip ${inv.status === 'active' ? 'chip-yellow' : 'chip-green'}`}>{inv.status}</span></td>
                              <td>
                                {wr
                                  ? <span className={`chip ${wr.status === 'paid' ? 'chip-green' : wr.status === 'rejected' ? 'chip-red' : 'chip-yellow'}`}>{wr.status}</span>
                                  : <span className="text-xs text-muted">—</span>
                                }
                              </td>
                            </tr>
                          )
                        })}
                        {investments.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No investments yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===== PACKAGES ===== */}
              {!loading && tab === 'Packages' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p className="text-sm text-muted">{packages.length} packages</p>
                    <button className="btn btn-gold" style={{ borderRadius: 10, padding: '.4rem 1rem', fontSize: '.82rem' }}
                      onClick={() => setEditPkg({ name: '', invest_amount: '', return_amount: '', duration_days: '', roi: '', img: '', status: 'active' })}>
                      <i className="fas fa-plus" /> Add Package
                    </button>
                  </div>
                  {editPkg && <PackageForm pkg={editPkg} onSave={savePackage} onCancel={() => setEditPkg(null)} />}
                  <table className="admin-table">
                    <thead>
                      <tr><th>Name</th><th>Invest</th><th>Return</th><th>Days</th><th>ROI</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {packages.map(pkg => (
                        <tr key={pkg.id}>
                          <td style={{ fontWeight: 600 }}>{pkg.name}</td>
                          <td>{fmtMoney(pkg.invest_amount)}</td>
                          <td style={{ color: 'var(--gold2)' }}>{fmtMoney(pkg.return_amount)}</td>
                          <td>{pkg.duration_days}d</td>
                          <td style={{ color: 'var(--gold2)' }}>{pkg.roi}</td>
                          <td>
                            <span className={`chip ${pkg.status === 'active' ? 'chip-green' : 'chip-red'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={async () => {
                                const next = pkg.status === 'active' ? 'paused' : 'active'
                                await savePackage({ ...pkg, status: next })
                              }}>
                              {pkg.status}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => setEditPkg(pkg)} style={{ background: 'none', border: 'none', color: 'var(--blue2)', cursor: 'pointer', marginRight: 8 }}>
                              <i className="fas fa-edit" />
                            </button>
                            <button onClick={() => handleDeletePackage(pkg.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                              <i className="fas fa-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ===== PLANS ===== */}
              {!loading && tab === 'Plans' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p className="text-sm text-muted">{plans.length} plans</p>
                    <button className="btn btn-gold" style={{ borderRadius: 10, padding: '.4rem 1rem', fontSize: '.82rem' }}
                      onClick={() => setEditPlan({ name: '', invest_amount: '', interest_pct: '', duration_hours: '', img: '', status: 'active' })}>
                      <i className="fas fa-plus" /> Add Plan
                    </button>
                  </div>
                  {editPlan && <PlanForm plan={editPlan} onSave={savePlan} onCancel={() => setEditPlan(null)} />}
                  <table className="admin-table">
                    <thead>
                      <tr><th>Name</th><th>Invest</th><th>Interest</th><th>Duration</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {plans.map(plan => (
                        <tr key={plan.id}>
                          <td style={{ fontWeight: 600 }}>{plan.name}</td>
                          <td>{fmtMoney(plan.invest_amount)}</td>
                          <td style={{ color: 'var(--gold2)' }}>{plan.interest_pct}%</td>
                          <td>{plan.duration_hours}h</td>
                          <td>
                            <span className={`chip ${plan.status === 'active' ? 'chip-green' : 'chip-red'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={async () => {
                                const next = plan.status === 'active' ? 'paused' : 'active'
                                await savePlan({ ...plan, status: next })
                              }}>
                              {plan.status}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => setEditPlan(plan)} style={{ background: 'none', border: 'none', color: 'var(--blue2)', cursor: 'pointer', marginRight: 8 }}>
                              <i className="fas fa-edit" />
                            </button>
                            <button onClick={() => handleDeletePlan(plan.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                              <i className="fas fa-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ===== BALANCE ADJUST ===== */}
              {!loading && tab === 'Balance Adjust' && (
                <div>
                  <p className="text-sm text-muted" style={{ marginBottom: '1.2rem' }}>
                    Manually credit or debit a user's wallet by their <strong>code</strong> or <strong>email</strong>.
                  </p>
                  <form onSubmit={handleBalanceAdjust} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.4rem' }}>
                    <div className="form-group">
                      <label>User Code or Email</label>
                      <input className="input" placeholder="e.g. GT-AB123 or user@email.com"
                        value={balTarget} onChange={e => setBalTarget(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Action</label>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        {[['add', '➕ Add'], ['remove', '➖ Remove'], ['set', '📌 Set to']].map(([val, label]) => (
                          <button key={val} type="button"
                            onClick={() => setBalMode(val)}
                            style={{
                              flex: 1, padding: '.5rem', borderRadius: 10, border: '1px solid var(--border)',
                              background: balMode === val ? 'var(--gold)' : 'var(--bg3)',
                              color: balMode === val ? '#000' : 'var(--text)',
                              fontWeight: 600, cursor: 'pointer', fontSize: '.82rem'
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Amount (GHS)</label>
                      <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00"
                        value={balAmount} onChange={e => setBalAmount(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Note (optional)</label>
                      <input className="input" placeholder="e.g. Bonus credit, manual correction…"
                        value={balNote} onChange={e => setBalNote(e.target.value)} />
                    </div>

                    {/* Preview */}
                    {balTarget && balAmount && (() => {
                      const u = users.find(u =>
                        u.unique_code?.toLowerCase() === balTarget.toLowerCase() ||
                        u.email?.toLowerCase() === balTarget.toLowerCase()
                      )
                      if (!u) return <p style={{ color: '#f87171', fontSize: '.83rem', marginBottom: '1rem' }}>⚠️ User not found</p>
                      const amt = parseFloat(balAmount) || 0
                      const cur = u.wallet_balance || 0
                      const after = balMode === 'add' ? cur + amt : balMode === 'remove' ? Math.max(0, cur - amt) : amt
                      return (
                        <div style={{ background: 'rgba(201,168,76,0.08)', borderRadius: 10, padding: '.8rem', marginBottom: '1rem', fontSize: '.83rem' }}>
                          <strong>{u.full_name}</strong> ({u.unique_code})<br />
                          <span className="text-muted">Current: </span><strong>{fmtMoney(cur)}</strong>
                          <span style={{ margin: '0 .4rem', color: 'var(--gold2)' }}>→</span>
                          <strong style={{ color: '#34d399' }}>{fmtMoney(after)}</strong>
                        </div>
                      )
                    })()}

                    <button type="submit" className="btn btn-gold btn-block" style={{ borderRadius: 12 }} disabled={balLoading}>
                      {balLoading
                        ? <><span className="spinner" style={{ width: 16, height: 16, marginRight: 8 }} />Processing…</>
                        : <><i className="fas fa-sliders-h" /> Apply Balance Change</>
                      }
                    </button>
                  </form>

                  {/* Recent users table for quick ref */}
                  <h4 style={{ margin: '1.5rem 0 .8rem', color: 'var(--muted)', fontSize: '.85rem' }}>All Users (for reference)</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr><th>Name</th><th>Code</th><th>Balance</th></tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setBalTarget(u.unique_code)}>
                            <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                            <td><code style={{ color: 'var(--gold2)', fontSize: '.78rem' }}>{u.unique_code}</code></td>
                            <td><strong style={{ color: 'var(--gold2)' }}>{fmtMoney(u.wallet_balance)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Inline Package Form ----
function PackageForm({ pkg, onSave, onCancel }) {
  const [form, setForm] = useState({ ...pkg })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, invest_amount: Number(form.invest_amount), return_amount: Number(form.return_amount), duration_days: Number(form.duration_days) })
  }
  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem', marginBottom: '1.2rem' }}>
      <h4 style={{ marginBottom: '1rem', color: 'var(--gold2)' }}>{pkg.id ? 'Edit Package' : 'New Package'}</h4>
      <div className="grid-2" style={{ gap: '.6rem' }}>
        {[
          ['Name', 'name', 'text', 'e.g. Rolls-Royce'],
          ['Invest Amount (GHS)', 'invest_amount', 'number', '399'],
          ['Return Amount (GHS)', 'return_amount', 'number', '1476.02'],
          ['Duration (days)', 'duration_days', 'number', '9'],
          ['ROI Label', 'roi', 'text', '270%'],
          ['Image URL', 'img', 'text', 'https://...'],
        ].map(([label, key, type, placeholder]) => (
          <div key={key} className="form-group" style={{ marginBottom: 0 }}>
            <label>{label}</label>
            <input className="input" type={type} placeholder={placeholder}
              value={form[key] || ''} onChange={e => set(key, e.target.value)} required={key !== 'img'} />
          </div>
        ))}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-gold" style={{ borderRadius: 10 }}>Save</button>
        <button type="button" className="btn btn-ghost" style={{ borderRadius: 10 }} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

// ---- Inline Plan Form ----
function PlanForm({ plan, onSave, onCancel }) {
  const [form, setForm] = useState({ ...plan })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, invest_amount: Number(form.invest_amount), interest_pct: Number(form.interest_pct), duration_hours: Number(form.duration_hours) })
  }
  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem', marginBottom: '1.2rem' }}>
      <h4 style={{ marginBottom: '1rem', color: 'var(--gold2)' }}>{plan.id ? 'Edit Plan' : 'New Plan'}</h4>
      <div className="grid-2" style={{ gap: '.6rem' }}>
        {[
          ['Name', 'name', 'text', 'e.g. Gold Plan'],
          ['Invest Amount (GHS)', 'invest_amount', 'number', '500'],
          ['Interest %', 'interest_pct', 'number', '75'],
          ['Duration (hours)', 'duration_hours', 'number', '48'],
          ['Image URL', 'img', 'text', 'https://...'],
        ].map(([label, key, type, placeholder]) => (
          <div key={key} className="form-group" style={{ marginBottom: 0 }}>
            <label>{label}</label>
            <input className="input" type={type} placeholder={placeholder}
              value={form[key] || ''} onChange={e => set(key, e.target.value)} />
          </div>
        ))}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-gold" style={{ borderRadius: 10 }}>Save</button>
        <button type="button" className="btn btn-ghost" style={{ borderRadius: 10 }} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
