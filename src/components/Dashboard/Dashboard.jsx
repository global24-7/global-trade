import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import {
  getUserInvestments, getUserPlanInvestments, getUserTransactions,
  updateInvestment, updatePlanInvestment, updateUserBalance, createTransaction,
} from '../../lib/db.js'
import Navbar from '../Layout/Navbar.jsx'
import DepositModal from '../Modals/DepositModal.jsx'
import InvestModal from '../Modals/InvestModal.jsx'
import PlanInvestModal from '../Modals/PlanInvestModal.jsx'
import WithdrawModal from '../Modals/WithdrawModal.jsx'
import AdminPanel from '../Admin/AdminPanel.jsx'
import InvestmentCard from './InvestmentCard.jsx'
import PlanInvestmentCard from './PlanInvestmentCard.jsx'
import { fmtMoney, fmtDate, planInvProgress, waLink } from '../../lib/utils.js'
import Loader from '../UI/Loader.jsx'

// Secret admin tap counter
let tapCount = 0
let tapTimer = null

export default function Dashboard() {
  const { user, refreshUser, packages, plans, toast } = useApp()
  const [investments, setInvestments] = useState([])
  const [planInvs, setPlanInvs] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview | packages | plans | transactions

  // Modals
  const [depositOpen, setDepositOpen] = useState(false)
  const [investPkg, setInvestPkg] = useState(null)
  const [investPlan, setInvestPlan] = useState(null)
  const [withdrawInv, setWithdrawInv] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [invs, pinvs, txs] = await Promise.all([
        getUserInvestments(user.id),
        getUserPlanInvestments(user.id),
        getUserTransactions(user.id),
      ])
      setInvestments(invs)
      setPlanInvs(pinvs)
      setTransactions(txs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  // Live countdown refresh every second
  useEffect(() => {
    const t = setInterval(() => setPlanInvs(p => [...p]), 1000)
    return () => clearInterval(t)
  }, [])

  // Check matured plan investments every minute
  useEffect(() => {
    const t = setInterval(async () => {
      const now = new Date()
      const matured = planInvs.filter(i => i.status === 'active' && new Date(i.end_date) <= now)
      for (const inv of matured) {
        await updatePlanInvestment(inv.id, { status: 'ready' }).catch(() => {})
      }
      if (matured.length) loadData()
    }, 60_000)
    return () => clearInterval(t)
  }, [planInvs, loadData])

  function handleLogoTap() {
    tapCount++
    clearTimeout(tapTimer)
    tapTimer = setTimeout(() => { tapCount = 0 }, 2000)
    if (tapCount >= 3) { tapCount = 0; setAdminOpen(true) }
  }

  async function collectReturn(inv) {
    try {
      const fresh = await refreshUser()
      const newBal = (fresh?.wallet_balance || 0) + inv.user_return
      await updateUserBalance(user.id, newBal)
      await updatePlanInvestment(inv.id, { status: 'collected' })
      await createTransaction({
        user_id: user.id, type: 'plan_return', amount: inv.user_return,
        note: `Return from ${inv.plan_name}`, created_at: new Date().toISOString()
      })
      toast(`GHS ${inv.user_return.toFixed(2)} added to your wallet!`, 'success')
      await refreshUser()
      await loadData()
    } catch (e) { toast(e.message || 'Failed to collect return', 'error') }
  }

  async function requestWithdrawal(inv) {
    try {
      await updateInvestment(inv.id, {
        withdrawal_requested: true, withdrawal_status: 'pending',
        withdrawal_date: new Date().toISOString()
      })
      await createTransaction({
        user_id: user.id, type: 'withdrawal_pending', amount: inv.return_amount,
        note: `Withdrawal pending: ${inv.package_name}`, created_at: new Date().toISOString()
      })
      const msg = `💸 *WITHDRAWAL REQUEST* 💸\nUser: ${user.full_name}\nCode: ${user.unique_code}\nPackage: ${inv.package_name}\nAmount: GHS ${inv.return_amount}\nPlease process my withdrawal.`
      window.open(waLink(msg), '_blank')
      toast('Withdrawal request sent! Admin will process it soon.', 'success')
      await loadData()
    } catch (e) { toast(e.message || 'Request failed', 'error') }
  }

  const activeInvs = investments.filter(i => i.status === 'active')
  const completedInvs = investments.filter(i => i.status === 'completed' || i.withdrawal_requested)
  const activePlanInvs = planInvs.filter(i => i.status === 'active' || i.status === 'ready')

  const totalInvested = [...activeInvs, ...activePlanInvs].reduce((s, i) => s + (i.invest_amount || 0), 0)

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-home' },
    { id: 'packages', label: 'Car Packages', icon: 'fas fa-car' },
    { id: 'plans', label: 'Plans', icon: 'fas fa-clock' },
    { id: 'transactions', label: 'Transactions', icon: 'fas fa-exchange-alt' },
  ]

  return (
    <>
      <Navbar onDeposit={() => setDepositOpen(true)} />

      <div className="dash-wrap">
        {/* Logo tap target (hidden, for admin access) */}
        <div onClick={handleLogoTap} style={{ position: 'fixed', top: 0, left: 0, width: 80, height: 65, zIndex: 1000, cursor: 'default' }} />

        {/* Balance Card */}
        <div className="balance-card">
          <div>
            <div className="balance-label">Wallet Balance</div>
            <div className="balance-amount">{fmtMoney(user?.wallet_balance || 0)}</div>
            <div className="text-sm text-muted mt-1">
              <i className="fas fa-chart-line" style={{ marginRight: 4 }} />
              {totalInvested > 0 ? `GHS ${totalInvested.toFixed(2)} actively invested` : 'No active investments'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}>
            <button className="btn btn-gold" onClick={() => setDepositOpen(true)}>
              <i className="fas fa-plus" /> Add Funds
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Active Investments', val: activeInvs.length + activePlanInvs.length, icon: 'fas fa-chart-bar', color: 'var(--blue2)' },
            { label: 'Completed',          val: completedInvs.length, icon: 'fas fa-check-circle', color: 'var(--green)' },
            { label: 'Total Transactions', val: transactions.length,  icon: 'fas fa-exchange-alt', color: 'var(--gold2)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '1.1rem' }}>
                <i className={s.icon} />
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700 }}>{s.val}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--gold)' : 'var(--bg3)',
                color: activeTab === tab.id ? '#000' : 'var(--muted)',
                border: 'none', borderRadius: 40, padding: '.45rem 1.1rem',
                fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', transition: '.2s',
                fontFamily: "'DM Sans',sans-serif"
              }}
            >
              <i className={tab.icon} style={{ marginRight: 6 }} />{tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
            <span className="spinner" style={{ width: 30, height: 30 }} />
            <p style={{ marginTop: '1rem' }}>Loading your portfolio...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                {/* Active car investments */}
                {activeInvs.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", marginBottom: '1rem' }}>Active Investments</h3>
                    {activeInvs.map(inv => (
                      <InvestmentCard key={inv.id} inv={inv} onWithdraw={() => setWithdrawInv(inv)} onRefresh={loadData} />
                    ))}
                  </div>
                )}

                {/* Active plan investments */}
                {activePlanInvs.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", marginBottom: '1rem' }}>Active Plans</h3>
                    {activePlanInvs.map(inv => (
                      <PlanInvestmentCard key={inv.id} inv={inv} onCollect={() => collectReturn(inv)} />
                    ))}
                  </div>
                )}

                {activeInvs.length === 0 && activePlanInvs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', background: 'var(--card)', borderRadius: 'var(--r2)', marginBottom: '2rem' }}>
                    <i className="fas fa-seedling" style={{ fontSize: '2.5rem', color: 'var(--gold)', marginBottom: '1rem', display: 'block' }} />
                    <h3 style={{ color: 'var(--text)', marginBottom: '.5rem' }}>No Active Investments</h3>
                    <p>Browse packages below or deposit funds to get started.</p>
                  </div>
                )}

                {/* Invest cards */}
                <h3 style={{ fontFamily: "'Playfair Display',serif", marginBottom: '1rem' }}>Available Packages</h3>
                <div className="grid-3">
                  {packages.filter(p => p.status === 'active').map(pkg => (
                    <div key={pkg.id} style={{
                      background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)',
                      padding: '1.4rem', cursor: 'pointer', transition: '.3s'
                    }} onClick={() => setInvestPkg(pkg)}>
                      <div style={{ width: '100%', height: 110, borderRadius: 12, overflow: 'hidden', marginBottom: '1rem', background: 'var(--bg3)' }}>
                        <img src={pkg.img} alt={pkg.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, marginBottom: '.2rem' }}>{pkg.name}</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold2)', fontFamily: "'Playfair Display',serif" }}>{pkg.roi}</div>
                      <div className="text-sm text-muted">GHS {pkg.invest_amount} · {pkg.duration_days} days</div>
                      <button className="btn btn-gold" style={{ width: '100%', marginTop: '.8rem', borderRadius: 10, justifyContent: 'center' }}>
                        Invest Now
                      </button>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontFamily: "'Playfair Display',serif", margin: '2rem 0 1rem' }}>Investment Plans</h3>
                <div className="grid-2">
                  {plans.filter(p => p.status === 'active').map(plan => {
                    const profit = plan.invest_amount * (plan.interest_pct / 100)
                    const total = plan.invest_amount + profit
                    const userReturn = total - (total * 0.10)
                    return (
                      <div key={plan.id} style={{
                        background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)',
                        padding: '1.4rem', cursor: 'pointer', transition: '.3s'
                      }} onClick={() => setInvestPlan(plan)}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, marginBottom: '.5rem' }}>{plan.name}</div>
                        <div className="flex-between text-sm" style={{ marginBottom: '.3rem' }}>
                          <span className="text-muted">Invest</span><strong>GHS {plan.invest_amount}</strong>
                        </div>
                        <div className="flex-between text-sm" style={{ marginBottom: '.3rem' }}>
                          <span className="text-muted">You receive</span><strong className="text-gold">GHS {userReturn.toFixed(2)}</strong>
                        </div>
                        <div className="flex-between text-sm" style={{ marginBottom: '.6rem' }}>
                          <span className="text-muted">Duration</span><span><i className="fas fa-clock" style={{ marginRight: 4 }} />{plan.duration_hours}h</span>
                        </div>
                        <button className="btn btn-blue" style={{ width: '100%', borderRadius: 10, justifyContent: 'center' }}>
                          Start Plan
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CAR PACKAGES TAB */}
            {activeTab === 'packages' && (
              <div>
                {investments.length === 0
                  ? <p className="text-muted" style={{ textAlign: 'center', padding: '3rem' }}>No car package investments yet.</p>
                  : investments.map(inv => (
                    <InvestmentCard key={inv.id} inv={inv} onWithdraw={() => setWithdrawInv(inv)} onRefresh={loadData} />
                  ))
                }
              </div>
            )}

            {/* PLANS TAB */}
            {activeTab === 'plans' && (
              <div>
                {planInvs.length === 0
                  ? <p className="text-muted" style={{ textAlign: 'center', padding: '3rem' }}>No plan investments yet.</p>
                  : planInvs.map(inv => (
                    <PlanInvestmentCard key={inv.id} inv={inv} onCollect={() => collectReturn(inv)} />
                  ))
                }
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {activeTab === 'transactions' && (
              <div className="card">
                <h3 style={{ fontFamily: "'Playfair Display',serif", marginBottom: '1.2rem' }}>Transaction History</h3>
                {transactions.length === 0
                  ? <p className="text-muted">No transactions yet.</p>
                  : transactions.map(tx => {
                    const isCredit = ['deposit', 'plan_return', 'withdrawal_approved'].includes(tx.type)
                    const icon = tx.type === 'deposit' ? 'fas fa-arrow-down' : tx.type.includes('withdrawal') ? 'fas fa-arrow-up' : 'fas fa-exchange-alt'
                    const iconBg = isCredit ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)'
                    const iconColor = isCredit ? '#34d399' : '#f87171'
                    return (
                      <div key={tx.id} className="tx-item">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div className="tx-icon" style={{ background: iconBg, color: iconColor }}>
                            <i className={icon} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>
                              {tx.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </div>
                            <div className="text-xs text-muted">{tx.note}</div>
                            <div className="text-xs text-muted">{fmtDate(tx.created_at)}</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: isCredit ? '#34d399' : '#f87171' }}>
                          {isCredit ? '+' : '-'}{fmtMoney(tx.amount)}
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {depositOpen && (
        <DepositModal
          onClose={() => setDepositOpen(false)}
          onSuccess={async () => { await refreshUser(); await loadData(); setDepositOpen(false) }}
        />
      )}
      {investPkg && (
        <InvestModal
          pkg={investPkg}
          onClose={() => setInvestPkg(null)}
          onSuccess={async () => { await refreshUser(); await loadData(); setInvestPkg(null) }}
        />
      )}
      {investPlan && (
        <PlanInvestModal
          plan={investPlan}
          onClose={() => setInvestPlan(null)}
          onSuccess={async () => { await refreshUser(); await loadData(); setInvestPlan(null) }}
        />
      )}
      {withdrawInv && (
        <WithdrawModal
          inv={withdrawInv}
          onClose={() => setWithdrawInv(null)}
          onSuccess={async () => { await loadData(); setWithdrawInv(null) }}
        />
      )}
      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </>
  )
}
