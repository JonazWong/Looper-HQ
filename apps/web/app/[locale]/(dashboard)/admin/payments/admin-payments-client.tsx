'use client'

import { useState } from 'react'
import { DollarSign, Users, CheckCircle2, XCircle, Clock, Pencil, Plus } from 'lucide-react'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { PremierButton } from '@/components/ui/premier-button'
import { StatCard } from '@/components/ui/stat-card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

interface Payment {
  id: string
  intentId: string
  orderId: string
  amount: number
  currency: string
  status: string
  targetTier: string
  createdAt: string
  user: { id: string; name: string | null; email: string; membershipTier: string }
  plan: { tier: string; name_zh: string } | null
}

interface Plan {
  id: string
  tier: string
  name_zh: string
  name_en: string
  amount: number | null
  currency: string
  isCustom: boolean
  isActive: boolean
}

interface Props {
  payments: Payment[]
  plans: Plan[]
  total: number
  page: number
  perPage: number
  currentStatus?: string
  stats: Record<string, { count: number; total: number }>
  locale: string
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  SUCCEEDED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  FAILED:    'bg-red-500/20 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function AdminPaymentsClient({
  payments, plans, total, page, perPage, currentStatus, stats, locale,
}: Props) {
  const totalPages = Math.ceil(total / perPage)

  // Plan editing state
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [planAmounts, setPlanAmounts] = useState<Record<string, string>>(
    Object.fromEntries(plans.map((p) => [p.id, p.amount?.toString() ?? '']))
  )
  const [savingPlan, setSavingPlan] = useState<string | null>(null)
  const [planSaveMsg, setPlanSaveMsg] = useState<Record<string, string>>({})

  // Manual intent state
  const [showCreateIntent, setShowCreateIntent] = useState(false)
  const [intentForm, setIntentForm] = useState({ userId: '', tier: 'PREMIER', amount: '', currency: 'HKD' })
  const [creatingIntent, setCreatingIntent] = useState(false)
  const [intentResult, setIntentResult] = useState<string | null>(null)

  async function savePlanAmount(plan: Plan) {
    setSavingPlan(plan.id)
    try {
      const res = await fetch(`/api/admin/payments/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: planAmounts[plan.id] ? Number(planAmounts[plan.id]) : null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)
      setPlanSaveMsg((prev) => ({ ...prev, [plan.id]: '✓ 已儲存' }))
      setEditingPlan(null)
      setTimeout(() => setPlanSaveMsg((prev) => ({ ...prev, [plan.id]: '' })), 2000)
    } catch (err) {
      setPlanSaveMsg((prev) => ({ ...prev, [plan.id]: `錯誤: ${err instanceof Error ? err.message : '未知'}` }))
    } finally {
      setSavingPlan(null)
    }
  }

  async function createAdminIntent() {
    setCreatingIntent(true)
    setIntentResult(null)
    try {
      const res = await fetch('/api/admin/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: intentForm.userId,
          tier: intentForm.tier,
          amount: Number(intentForm.amount),
          currency: intentForm.currency,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)
      setIntentResult(`✅ Intent 已建立: ${json.data.intentId}\n請將 Payment Link 傳送給用戶。`)
    } catch (err) {
      setIntentResult(`❌ ${err instanceof Error ? err.message : '錯誤'}`)
    } finally {
      setCreatingIntent(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">付款管理</h1>
          <p className="text-premier-pearl-gray">管理 Airwallex 付款記錄及會員方案定價</p>
        </div>
        <PremierButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateIntent(true)}>
          手動建立 Intent
        </PremierButton>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="成功付款" value={stats.SUCCEEDED?.count ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} variant="success" />
        <StatCard title="待處理" value={stats.PENDING?.count ?? 0} icon={<Clock className="h-4 w-4" />} variant="warning" />
        <StatCard title="失敗" value={stats.FAILED?.count ?? 0} icon={<XCircle className="h-4 w-4" />} variant="danger" />
        <StatCard
          title="總收款 (HKD)"
          value={`$${(stats.SUCCEEDED?.total ?? 0).toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          variant="success"
        />
      </div>

      {/* Plan Pricing Management */}
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle>方案定價管理</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-premier-gold/20">
                <TableHead className="text-premier-gold">方案</TableHead>
                <TableHead className="text-premier-gold">類型</TableHead>
                <TableHead className="text-premier-gold">金額 (HKD/月)</TableHead>
                <TableHead className="text-premier-gold">狀態</TableHead>
                <TableHead className="text-premier-gold text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} className="border-premier-gold/10 hover:bg-premier-gold/5">
                  <TableCell className="font-medium text-premier-pearl">{plan.name_zh}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={plan.isCustom ? 'text-premier-mystery-violet border-premier-mystery-violet/40' : 'text-premier-gold border-premier-gold/40'}>
                      {plan.isCustom ? '企業自定義' : '標準'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingPlan === plan.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={planAmounts[plan.id]}
                          onChange={(e) => setPlanAmounts((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                          placeholder="留空 = 自定義"
                          className="w-28 rounded border border-premier-gold/30 bg-premier-black/60 px-2 py-1 text-sm text-premier-pearl"
                        />
                        <PremierButton size="sm" variant="primary" onClick={() => savePlanAmount(plan)} disabled={!!savingPlan}>
                          {savingPlan === plan.id ? '儲存中…' : '儲存'}
                        </PremierButton>
                        <PremierButton size="sm" variant="ghost" onClick={() => setEditingPlan(null)}>取消</PremierButton>
                      </div>
                    ) : (
                      <span className="text-premier-pearl">
                        {plan.amount !== null ? `HK$${plan.amount.toLocaleString()}` : '聯絡我們'}
                        {planSaveMsg[plan.id] && (
                          <span className="ml-2 text-xs text-emerald-400">{planSaveMsg[plan.id]}</span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={plan.isActive ? 'text-emerald-400 border-emerald-500/40' : 'text-gray-400 border-gray-500/40'}>
                      {plan.isActive ? '啟用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingPlan !== plan.id && (
                      <PremierButton size="sm" variant="ghost" icon={<Pencil className="h-3 w-3" />} onClick={() => setEditingPlan(plan.id)}>
                        編輯
                      </PremierButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCardContent>
      </GlassCard>

      {/* Manual Intent Creation Modal */}
      {showCreateIntent && (
        <GlassCard variant="default">
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle>手動建立 Payment Intent（尊貴會員）</GlassCardTitle>
              <PremierButton size="sm" variant="ghost" onClick={() => { setShowCreateIntent(false); setIntentResult(null) }}>✕ 關閉</PremierButton>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-premier-pearl-gray mb-1">用戶 ID</label>
                <input
                  value={intentForm.userId}
                  onChange={(e) => setIntentForm((p) => ({ ...p, userId: e.target.value }))}
                  placeholder="cuid..."
                  className="w-full rounded border border-premier-gold/30 bg-premier-black/60 px-3 py-2 text-sm text-premier-pearl"
                />
              </div>
              <div>
                <label className="block text-sm text-premier-pearl-gray mb-1">目標方案</label>
                <select
                  value={intentForm.tier}
                  onChange={(e) => setIntentForm((p) => ({ ...p, tier: e.target.value }))}
                  className="w-full rounded border border-premier-gold/30 bg-premier-black/60 px-3 py-2 text-sm text-premier-pearl"
                >
                  <option value="STANDARD">STANDARD 基本版</option>
                  <option value="PREMIUM">PREMIUM 專業版</option>
                  <option value="PREMIER">PREMIER 機構版</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-premier-pearl-gray mb-1">特別金額 (HKD)</label>
                <input
                  type="number"
                  value={intentForm.amount}
                  onChange={(e) => setIntentForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="例: 8000"
                  className="w-full rounded border border-premier-gold/30 bg-premier-black/60 px-3 py-2 text-sm text-premier-pearl"
                />
              </div>
              <div className="flex items-end">
                <PremierButton
                  variant="primary"
                  onClick={createAdminIntent}
                  disabled={creatingIntent || !intentForm.userId || !intentForm.amount}
                >
                  {creatingIntent ? '建立中…' : '建立 Intent'}
                </PremierButton>
              </div>
            </div>
            {intentResult && (
              <pre className="mt-4 rounded bg-premier-black/60 p-3 text-xs text-premier-pearl whitespace-pre-wrap border border-premier-gold/20">
                {intentResult}
              </pre>
            )}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Payment Records Table */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <GlassCardTitle>付款記錄 ({total})</GlassCardTitle>
            <div className="flex gap-2 flex-wrap">
              {['', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED'].map((s) => (
                <Link key={s} href={`/${locale}/admin/payments${s ? `?status=${s}` : ''}`}>
                  <Badge
                    variant="outline"
                    className={currentStatus === s || (!currentStatus && s === '')
                      ? 'bg-premier-gold/20 text-premier-gold border-premier-gold/40 cursor-pointer'
                      : 'text-premier-pearl-gray border-premier-gold/20 hover:bg-premier-gold/10 cursor-pointer'}
                  >
                    {s || '全部'}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-premier-gold/20">
                <TableHead className="text-premier-gold">用戶</TableHead>
                <TableHead className="text-premier-gold">目標等級</TableHead>
                <TableHead className="text-premier-gold">金額</TableHead>
                <TableHead className="text-premier-gold">狀態</TableHead>
                <TableHead className="text-premier-gold">Intent ID</TableHead>
                <TableHead className="text-premier-gold">時間</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-premier-pearl-gray py-8">
                    暫無付款記錄
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id} className="border-premier-gold/10 hover:bg-premier-gold/5">
                    <TableCell>
                      <div>
                        <p className="text-premier-pearl text-sm font-medium">{p.user.name ?? '—'}</p>
                        <p className="text-premier-pearl-gray text-xs">{p.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-premier-gold border-premier-gold/40">
                        {p.targetTier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-premier-pearl font-medium">
                      {p.currency} {p.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[p.status] ?? ''}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-premier-pearl/50 max-w-[160px] truncate">
                      {p.intentId}
                    </TableCell>
                    <TableCell className="text-premier-pearl-gray text-xs">
                      {new Date(p.createdAt).toLocaleString('zh-HK')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end gap-2 pt-4">
              {page > 1 && (
                <Link href={`/${locale}/admin/payments?page=${page - 1}${currentStatus ? `&status=${currentStatus}` : ''}`}>
                  <PremierButton variant="ghost" size="sm">上一頁</PremierButton>
                </Link>
              )}
              <span className="flex items-center text-sm text-premier-pearl-gray px-2">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/${locale}/admin/payments?page=${page + 1}${currentStatus ? `&status=${currentStatus}` : ''}`}>
                  <PremierButton variant="ghost" size="sm">下一頁</PremierButton>
                </Link>
              )}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
