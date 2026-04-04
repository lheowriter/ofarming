'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Buyer = {
  id: string
  company: string
  country: string
  contact: string
  email: string
  product: string
  volume: string
  payment: string
  verified: 'Yes' | 'No'
  source: string
  notes: string
}

type Seller = {
  id: string
  company: string
  contact: string
  email: string
  product: string
  origin: string
  delivery: string
  verified: 'Yes' | 'No'
  source: string
  notes: string
}

type Deal = {
  id: string
  buyerId: string
  sellerId: string
  product: string
  volume: string
  stage: string
  status: 'Active' | 'Paused' | 'Dead'
  commission: string
  notes: string
  nextAction: string
  inboundMessage: string
  updatedAt: string
}

type IntakeSubmission = {
  id: string
  type: 'Buyer' | 'Seller'
  company: string
  contact: string
  email: string
  product: string
  volume: string
  geography: string
  terms: string
  notes: string
  status: 'New' | 'Reviewed' | 'Converted'
  createdAt: string
}

type TabKey = 'dashboard' | 'buyers' | 'sellers' | 'deals' | 'intake' | 'scripts'

const STORAGE_KEY = 'ofarming-lite-clean-canvas'
const stageOrder = ['Lead', 'ICPO', 'FCO', 'SPA', 'LC Opened', 'POP', 'Shipment', 'Closed']
const scriptLibrary: Record<string, { title: string; body: string }> = {
  buyerInitial: {
    title: 'Buyer Initial Outreach',
    body: `Hello [Name],\n\nWe are currently coordinating EN590 (10ppm) allocations from verified supply sources.\n\nWe are prioritizing direct buyers with LC capability for CIF and FOB deliveries.\n\nPlease confirm:\n- Monthly volume requirement\n- Delivery preference (FOB or CIF)\n- Payment method (LC / SBLC)\n\nIf aligned, we will proceed with supply-side coordination and FCO.\n\nRegards,\n[Your Name]`,
  },
  sellerInitial: {
    title: 'Seller Initial Outreach',
    body: `Hello [Name],\n\nWe are currently working with buyers seeking EN590 (10ppm) on CIF terms with LC payment.\n\nWe are expanding our supplier network and are looking to establish direct coordination with verified sellers.\n\nPlease confirm:\n- Available volume\n- Origin\n- Pricing structure\n- Documentation available (FCO / specs)\n\nIf aligned, we can move toward buyer-side alignment.\n\nRegards,\n[Your Name]`,
  },
  buyerQualification: {
    title: 'Buyer Qualification',
    body: `Hello [Name],\n\nBefore proceeding, please confirm:\n- Monthly volume requirement (MT)\n- Delivery terms (CIF or FOB)\n- Target port\n- Payment method (LC / SBLC)\n- Ability to issue ICPO\n\nRegards,\n[Your Name]`,
  },
  sellerQualification: {
    title: 'Seller Qualification',
    body: `Hello [Name],\n\nBefore aligning with active buyers, please confirm:\n- Available monthly volume\n- Origin and loading port\n- Pricing structure (FOB / CIF)\n- Payment terms\n- Supporting documents (FCO / specs / POP)\n\nRegards,\n[Your Name]`,
  },
}

const seed = {
  buyers: [
    {
      id: 'B-001',
      company: 'Tema Fuel Imports Ltd',
      country: 'Ghana',
      contact: 'Kwame Mensah',
      email: 'kwame@temafuel.example',
      product: 'EN590 10ppm',
      volume: '100,000 MT / month',
      payment: 'LC',
      verified: 'Yes' as const,
      source: 'LinkedIn',
      notes: 'Interested in CIF offers to Tema Port.',
    },
  ] as Buyer[],
  sellers: [
    {
      id: 'S-001',
      company: 'North Sea Trade Energy',
      contact: 'Martin Voss',
      email: 'martin@northsea.example',
      product: 'EN590 10ppm',
      origin: 'Rotterdam',
      delivery: 'CIF',
      verified: 'Yes' as const,
      source: 'Referral',
      notes: 'Can quote monthly contracts.',
    },
  ] as Seller[],
  deals: [
    {
      id: 'D-001',
      buyerId: 'B-001',
      sellerId: 'S-001',
      product: 'EN590 10ppm',
      volume: '100,000 MT',
      stage: 'Lead',
      status: 'Active' as const,
      commission: '$300,000',
      notes: 'Buyer requested CIF pricing to Tema Port.',
      nextAction: 'Request ICPO',
      inboundMessage: 'Yes, we are interested. Send details.',
      updatedAt: '2026-03-31',
    },
  ] as Deal[],
  intakeSubmissions: [
    {
      id: 'INT-001',
      type: 'Buyer' as const,
      company: 'Test Energy Ghana',
      contact: 'Procurement Desk',
      email: 'procurement@testenergy.example',
      product: 'EN590 10ppm',
      volume: '50,000 MT / month',
      geography: 'Tema Port, Ghana',
      terms: 'CIF / LC',
      notes: 'Demo intake buyer.',
      status: 'Reviewed' as const,
      createdAt: '2026-03-31',
    },
  ] as IntakeSubmission[],
}

export function __ofarmingSmokeTests() {
  return {
    stageProgressClosed: stageToProgress('Closed') === 100,
    nextIdWorks: buildNextId('B', [{ id: 'B-001' }]) === 'B-002',
    moneyToNumberWorks: moneyToNumber('$300,000') === 300000,
    scriptsExist: !!scriptLibrary.buyerInitial && !!scriptLibrary.sellerInitial,
  }
}

function safeLoad() {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveData(data: unknown) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}
async function saveToSupabase(submission: IntakeSubmission) {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const payload = {
      type: submission.type,
      company: submission.company,
      contact: submission.contact,
      email: submission.email,
      product: submission.product,
      volume: submission.volume,
      geography: submission.geography,
      terms: submission.terms,
      notes: submission.notes,
      status: submission.status,
      created_at: submission.createdAt,
    }

    const { error } = await supabase
      .from('intake_submissions')
      .insert([payload])

    if (error) {
      console.error('Supabase save error:', error.message)
    } else {
      console.log('Saved to Supabase ✅')
    }
  } catch (err) {
    console.error('Supabase save crash:', err)
  }

}
async function loadIntakeFromSupabase() {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data, error } = await supabase
      .from('intake_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase load error:', error.message)
      return []
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      type: row.type as 'Buyer' | 'Seller',
      company: row.company || '',
      contact: row.contact || '',
      email: row.email || '',
      product: row.product || '',
      volume: row.volume || '',
      geography: row.geography || '',
      terms: row.terms || '',
      notes: row.notes || '',
      status: row.status as 'New' | 'Reviewed' | 'Converted',
      createdAt: row.created_at ? String(row.created_at).slice(0, 10) : '',
    })) as IntakeSubmission[]
  } catch (err) {
    console.error('Supabase load crash:', err)
    return []
  }
}
function buildNextId(prefix: string, items: Array<{ id: string }>) {
  return `${prefix}-${String(items.length + 1).padStart(3, '0')}`
}

function stageToProgress(stage: string) {
  const idx = stageOrder.indexOf(stage)
  return idx < 0 ? 0 : Math.round((idx / (stageOrder.length - 1)) * 100)
}

function moneyToNumber(value: unknown) {
  return Number(String(value || '').replace(/[$,]/g, '')) || 0
}

function getDefaultNextAction(stage: string) {
  const map: Record<string, string> = {
    Lead: 'Request ICPO',
    ICPO: 'Validate ICPO terms',
    FCO: 'Push FCO review',
    SPA: 'Draft SPA',
    'LC Opened': 'Confirm banking process',
    POP: 'Verify POP',
    Shipment: 'Track shipment',
    Closed: 'Collect commission',
  }
  return map[stage] || 'Review deal'
}

function getSuggestedScriptKey(stage: string) {
  if (stage === 'Lead') return 'buyerQualification'
  if (stage === 'ICPO') return 'buyerQualification'
  if (stage === 'FCO') return 'sellerQualification'
  return 'buyerInitial'
}

function SimpleProgress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${props.className || ''}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[92px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${props.className || ''}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${props.className || ''}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 ${props.className || ''}`} />
}

function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${props.className || ''}`} />
}

function Card({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{children}</span>
}

function Toolbar({ search, setSearch }: { search: string; setSearch: (value: string) => void }) {
  return <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="max-w-md" />
}

export default function OFarmingLiteApp() {
  const initial = useMemo(() => safeLoad() || seed, [])
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [buyers, setBuyers] = useState<Buyer[]>(initial.buyers)
  const [sellers, setSellers] = useState<Seller[]>(initial.sellers)
  const [deals, setDeals] = useState<Deal[]>(initial.deals)
  const [intakeSubmissions, setIntakeSubmissions] = useState<IntakeSubmission[]>(initial.intakeSubmissions)
  const [notice, setNotice] = useState('')
  const [dealError, setDealError] = useState('')

  const [buyerSearch, setBuyerSearch] = useState('')
  const [sellerSearch, setSellerSearch] = useState('')
  const [dealSearch, setDealSearch] = useState('')

  const [newBuyer, setNewBuyer] = useState<Omit<Buyer, 'id'>>({
    company: '', country: '', contact: '', email: '', product: 'EN590 10ppm', volume: '', payment: 'Unknown', verified: 'No', source: '', notes: '',
  })
  const [newSeller, setNewSeller] = useState<Omit<Seller, 'id'>>({
    company: '', contact: '', email: '', product: 'EN590 10ppm', origin: '', delivery: 'CIF', verified: 'No', source: '', notes: '',
  })
  const [newDeal, setNewDeal] = useState<Omit<Deal, 'id' | 'updatedAt'>>({
    buyerId: '', sellerId: '', product: 'EN590 10ppm', volume: '', stage: 'Lead', status: 'Active', commission: '', notes: '', nextAction: 'Request ICPO', inboundMessage: '',
  })
  const [buyerIntakeForm, setBuyerIntakeForm] = useState<Omit<IntakeSubmission, 'id' | 'type' | 'status' | 'createdAt'>>({
    company: '', contact: '', email: '', product: 'EN590 10ppm', volume: '', geography: '', terms: 'CIF / LC', notes: '',
  })
  const [sellerIntakeForm, setSellerIntakeForm] = useState<Omit<IntakeSubmission, 'id' | 'type' | 'status' | 'createdAt'>>({
    company: '', contact: '', email: '', product: 'EN590 10ppm', volume: '', geography: '', terms: 'FOB / CIF', notes: '',
  })

  useEffect(() => {
    saveData({ buyers, sellers, deals, intakeSubmissions })
  }, [buyers, sellers, deals, intakeSubmissions])
useEffect(() => {
  loadIntakeFromSupabase().then((rows) => {
    if (rows.length > 0) {
      setIntakeSubmissions(rows)
    }
  })
}, [])
  const buyerMap = useMemo(() => Object.fromEntries(buyers.map((b) => [b.id, b])), [buyers])
  const sellerMap = useMemo(() => Object.fromEntries(sellers.map((s) => [s.id, s])), [sellers])

  const filteredBuyers = buyers.filter((b) => [b.company, b.country, b.contact, b.email].join(' ').toLowerCase().includes(buyerSearch.toLowerCase()))
  const filteredSellers = sellers.filter((s) => [s.company, s.origin, s.contact, s.email].join(' ').toLowerCase().includes(sellerSearch.toLowerCase()))
  const filteredDeals = deals.filter((d) => [buyerMap[d.buyerId]?.company || '', sellerMap[d.sellerId]?.company || '', d.stage, d.status, d.product].join(' ').toLowerCase().includes(dealSearch.toLowerCase()))

  const stats = useMemo(() => ({
    verifiedBuyers: buyers.filter((b) => b.verified === 'Yes').length,
    verifiedSellers: sellers.filter((s) => s.verified === 'Yes').length,
    activeDeals: deals.filter((d) => d.status === 'Active').length,
    pipelineValue: deals.reduce((sum, d) => sum + moneyToNumber(d.commission), 0),
  }), [buyers, sellers, deals])

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setNotice(label)
      setTimeout(() => setNotice(''), 1600)
    } catch {
      setNotice('Copy failed')
      setTimeout(() => setNotice(''), 1600)
    }
  }

  function addBuyer() {
    if (!newBuyer.company || !newBuyer.contact) return
    setBuyers((prev) => [{ id: buildNextId('B', prev), ...newBuyer }, ...prev])
    setNewBuyer({ company: '', country: '', contact: '', email: '', product: 'EN590 10ppm', volume: '', payment: 'Unknown', verified: 'No', source: '', notes: '' })
  }

  function addSeller() {
    if (!newSeller.company || !newSeller.contact) return
    setSellers((prev) => [{ id: buildNextId('S', prev), ...newSeller }, ...prev])
    setNewSeller({ company: '', contact: '', email: '', product: 'EN590 10ppm', origin: '', delivery: 'CIF', verified: 'No', source: '', notes: '' })
  }

  function addDeal() {
    if (!newDeal.buyerId || !newDeal.sellerId || !newDeal.volume) {
      setDealError('Buyer, seller, and volume are required.')
      return
    }
    setDeals((prev) => [{ id: buildNextId('D', prev), ...newDeal, updatedAt: new Date().toISOString().slice(0, 10) }, ...prev])
    setDealError('')
    setNewDeal({ buyerId: '', sellerId: '', product: 'EN590 10ppm', volume: '', stage: 'Lead', status: 'Active', commission: '', notes: '', nextAction: 'Request ICPO', inboundMessage: '' })
  }

  function markIntakeReviewed(id: string) {
    setIntakeSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: 'Reviewed' } : s))
  }

  function submitBuyerIntake() {
    if (!buyerIntakeForm.company || !buyerIntakeForm.contact || !buyerIntakeForm.email) return
    const submission: IntakeSubmission = {
      id: buildNextId('INT', intakeSubmissions),
      type: 'Buyer',
      ...buyerIntakeForm,
      status: 'New',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setIntakeSubmissions((prev) => [submission, ...prev])
    saveToSupabase(submission)
    setBuyerIntakeForm({ company: '', contact: '', email: '', product: 'EN590 10ppm', volume: '', geography: '', terms: 'CIF / LC', notes: '' })
    setNotice('Buyer intake submitted')
    setTimeout(() => setNotice(''), 1600)
  }

  function submitSellerIntake() {
    if (!sellerIntakeForm.company || !sellerIntakeForm.contact || !sellerIntakeForm.email) return
    const submission: IntakeSubmission = {
      id: buildNextId('INT', intakeSubmissions),
      type: 'Seller',
      ...sellerIntakeForm,
      status: 'New',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setIntakeSubmissions((prev) => [submission, ...prev])
    saveToSupabase(submission)
    setSellerIntakeForm({ company: '', contact: '', email: '', product: 'EN590 10ppm', volume: '', geography: '', terms: 'FOB / CIF', notes: '' })
    setNotice('Seller intake submitted')
    setTimeout(() => setNotice(''), 1600)
  }

  function convertIntake(id: string) {
    const sub = intakeSubmissions.find((s) => s.id === id)
    if (!sub) return
    if (sub.type === 'Buyer') {
      setBuyers((prev) => [{
        id: buildNextId('B', prev),
        company: sub.company,
        country: sub.geography,
        contact: sub.contact,
        email: sub.email,
        product: sub.product,
        volume: sub.volume,
        payment: sub.terms.includes('LC') ? 'LC' : 'Unknown',
        verified: 'No',
        source: 'Intake Form',
        notes: sub.notes,
      }, ...prev])
    } else {
      setSellers((prev) => [{
        id: buildNextId('S', prev),
        company: sub.company,
        contact: sub.contact,
        email: sub.email,
        product: sub.product,
        origin: sub.geography,
        delivery: sub.terms.includes('FOB') ? 'FOB' : 'CIF',
        verified: 'No',
        source: 'Intake Form',
        notes: sub.notes,
      }, ...prev])
    }
    setIntakeSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: 'Converted' } : s))
  }

  function resetDemo() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
    setBuyers(seed.buyers)
    setSellers(seed.sellers)
    setDeals(seed.deals)
    setIntakeSubmissions(seed.intakeSubmissions)
    setNotice('Demo reset')
    setTimeout(() => setNotice(''), 1600)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">OFarming Lite</div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Oil Brokerage Operating System</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">Private desk for buyers, sellers, deals, intake, and scripts.</p>
            </div>
            <GhostButton onClick={resetDemo} className="bg-white text-slate-900">Reset Demo</GhostButton>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">Verified Buyers</p><p className="mt-1 text-2xl font-semibold">{stats.verifiedBuyers}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">Verified Sellers</p><p className="mt-1 text-2xl font-semibold">{stats.verifiedSellers}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">Active Deals</p><p className="mt-1 text-2xl font-semibold">{stats.activeDeals}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">Pipeline Commission</p><p className="mt-1 text-2xl font-semibold">${stats.pipelineValue.toLocaleString()}</p></div>
          </div>
        </div>

        {notice ? <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{notice}</div> : null}

        <div className="mb-6 flex flex-wrap gap-2">
          {(['dashboard', 'buyers', 'sellers', 'deals', 'intake', 'scripts'] as TabKey[]).map((key) => (
            <button key={key} onClick={() => setTab(key)} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === key ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Priority Deal Queue" subtitle="Which deals deserve attention first.">
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2"><strong>{deal.id}</strong><Badge>{deal.stage}</Badge><Badge>{deal.status}</Badge></div>
                    <p className="mt-1 text-sm text-slate-500">{buyerMap[deal.buyerId]?.company || 'Unknown Buyer'} → {sellerMap[deal.sellerId]?.company || 'Unknown Seller'}</p>
                    <p className="mt-2 text-xs text-slate-400">{deal.nextAction}</p>
                    <div className="mt-3"><SimpleProgress value={stageToProgress(deal.stage)} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Desk Notes" subtitle="Quick operational guidance.">
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 p-4">Use Intake to capture external requests without exposing your desk.</div>
                <div className="rounded-xl border border-slate-200 p-4">Use Scripts to avoid sounding new in outreach.</div>
              </div>
            </Card>
            <Card title="System Status" subtitle="What is working right now.">
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 p-4">Canvas preview: working</div>
                <div className="rounded-xl border border-slate-200 p-4">Local persistence: working</div>
                <div className="rounded-xl border border-slate-200 p-4">Intake routing: working</div>
              </div>
            </Card>
          </div>
        )}

        {tab === 'buyers' && (
          <Card title="Buyers" subtitle="Track importers and qualification status.">
            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label><div className="mb-1 text-sm font-medium">Company</div><Input value={newBuyer.company} onChange={(e) => setNewBuyer({ ...newBuyer, company: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Country</div><Input value={newBuyer.country} onChange={(e) => setNewBuyer({ ...newBuyer, country: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Contact</div><Input value={newBuyer.contact} onChange={(e) => setNewBuyer({ ...newBuyer, contact: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Email</div><Input value={newBuyer.email} onChange={(e) => setNewBuyer({ ...newBuyer, email: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Source</div><Input value={newBuyer.source} onChange={(e) => setNewBuyer({ ...newBuyer, source: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Verified</div><Select value={newBuyer.verified} onChange={(e) => setNewBuyer({ ...newBuyer, verified: e.target.value as 'Yes' | 'No' })}><option value="Yes">Yes</option><option value="No">No</option></Select></label>
              <label><div className="mb-1 text-sm font-medium">Payment</div><Input value={newBuyer.payment} onChange={(e) => setNewBuyer({ ...newBuyer, payment: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Volume</div><Input value={newBuyer.volume} onChange={(e) => setNewBuyer({ ...newBuyer, volume: e.target.value })} /></label>
              <div className="md:col-span-2 xl:col-span-4"><label><div className="mb-1 text-sm font-medium">Notes</div><Textarea value={newBuyer.notes} onChange={(e) => setNewBuyer({ ...newBuyer, notes: e.target.value })} /></label></div>
              <div className="xl:col-span-4"><Button onClick={addBuyer}>Save Buyer</Button></div>
            </div>
            <Toolbar search={buyerSearch} setSearch={setBuyerSearch} />
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Company</th><th className="px-4 py-3 text-left">Country</th><th className="px-4 py-3 text-left">Contact</th><th className="px-4 py-3 text-left">Email</th></tr></thead><tbody>{filteredBuyers.map((b) => <tr key={b.id} className="border-t border-slate-200"><td className="px-4 py-3">{b.company}</td><td className="px-4 py-3">{b.country}</td><td className="px-4 py-3">{b.contact}</td><td className="px-4 py-3">{b.email}</td></tr>)}</tbody></table>
            </div>
          </Card>
        )}

        {tab === 'sellers' && (
          <Card title="Sellers" subtitle="Track suppliers and verification state.">
            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label><div className="mb-1 text-sm font-medium">Company</div><Input value={newSeller.company} onChange={(e) => setNewSeller({ ...newSeller, company: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Contact</div><Input value={newSeller.contact} onChange={(e) => setNewSeller({ ...newSeller, contact: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Email</div><Input value={newSeller.email} onChange={(e) => setNewSeller({ ...newSeller, email: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Origin</div><Input value={newSeller.origin} onChange={(e) => setNewSeller({ ...newSeller, origin: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Source</div><Input value={newSeller.source} onChange={(e) => setNewSeller({ ...newSeller, source: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Verified</div><Select value={newSeller.verified} onChange={(e) => setNewSeller({ ...newSeller, verified: e.target.value as 'Yes' | 'No' })}><option value="Yes">Yes</option><option value="No">No</option></Select></label>
              <label><div className="mb-1 text-sm font-medium">Delivery</div><Input value={newSeller.delivery} onChange={(e) => setNewSeller({ ...newSeller, delivery: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Product</div><Input value={newSeller.product} onChange={(e) => setNewSeller({ ...newSeller, product: e.target.value })} /></label>
              <div className="md:col-span-2 xl:col-span-4"><label><div className="mb-1 text-sm font-medium">Notes</div><Textarea value={newSeller.notes} onChange={(e) => setNewSeller({ ...newSeller, notes: e.target.value })} /></label></div>
              <div className="xl:col-span-4"><Button onClick={addSeller}>Save Seller</Button></div>
            </div>
            <Toolbar search={sellerSearch} setSearch={setSellerSearch} />
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Company</th><th className="px-4 py-3 text-left">Origin</th><th className="px-4 py-3 text-left">Contact</th><th className="px-4 py-3 text-left">Email</th></tr></thead><tbody>{filteredSellers.map((s) => <tr key={s.id} className="border-t border-slate-200"><td className="px-4 py-3">{s.company}</td><td className="px-4 py-3">{s.origin}</td><td className="px-4 py-3">{s.contact}</td><td className="px-4 py-3">{s.email}</td></tr>)}</tbody></table>
            </div>
          </Card>
        )}

        {tab === 'deals' && (
          <Card title="Deals" subtitle="Track active deal flow and next actions.">
            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label><div className="mb-1 text-sm font-medium">Buyer</div><Select value={newDeal.buyerId} onChange={(e) => setNewDeal({ ...newDeal, buyerId: e.target.value })}><option value="">Select buyer</option>{buyers.map((b) => <option key={b.id} value={b.id}>{b.company}</option>)}</Select></label>
              <label><div className="mb-1 text-sm font-medium">Seller</div><Select value={newDeal.sellerId} onChange={(e) => setNewDeal({ ...newDeal, sellerId: e.target.value })}><option value="">Select seller</option>{sellers.map((s) => <option key={s.id} value={s.id}>{s.company}</option>)}</Select></label>
              <label><div className="mb-1 text-sm font-medium">Volume</div><Input value={newDeal.volume} onChange={(e) => setNewDeal({ ...newDeal, volume: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Commission</div><Input value={newDeal.commission} onChange={(e) => setNewDeal({ ...newDeal, commission: e.target.value })} /></label>
              <label><div className="mb-1 text-sm font-medium">Stage</div><Select value={newDeal.stage} onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value, nextAction: getDefaultNextAction(e.target.value) })}>{stageOrder.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</Select></label>
              <label><div className="mb-1 text-sm font-medium">Status</div><Select value={newDeal.status} onChange={(e) => setNewDeal({ ...newDeal, status: e.target.value as Deal['status'] })}><option value="Active">Active</option><option value="Paused">Paused</option><option value="Dead">Dead</option></Select></label>
              <div className="md:col-span-2 xl:col-span-4"><label><div className="mb-1 text-sm font-medium">Inbound Message</div><Textarea value={newDeal.inboundMessage} onChange={(e) => setNewDeal({ ...newDeal, inboundMessage: e.target.value })} /></label></div>
              <div className="md:col-span-2 xl:col-span-4"><label><div className="mb-1 text-sm font-medium">Notes</div><Textarea value={newDeal.notes} onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })} /></label></div>
              {dealError ? <div className="xl:col-span-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{dealError}</div> : null}
              <div className="xl:col-span-4"><Button onClick={addDeal}>Save Deal</Button></div>
            </div>
            <Toolbar search={dealSearch} setSearch={setDealSearch} />
            <div className="mt-4 space-y-4">
              {filteredDeals.map((d) => {
                const suggested = scriptLibrary[getSuggestedScriptKey(d.stage)]
                return (
                  <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2"><strong>{d.id}</strong><Badge>{d.stage}</Badge><Badge>{d.status}</Badge></div>
                    <p className="mt-1 text-sm text-slate-500">{buyerMap[d.buyerId]?.company || 'Unknown Buyer'} → {sellerMap[d.sellerId]?.company || 'Unknown Seller'}</p>
                    <div className="mt-3"><SimpleProgress value={stageToProgress(d.stage)} /></div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-800">Suggested Script: {suggested.title}</p>
                      <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{suggested.body}</pre>
                      <GhostButton onClick={() => copyText(suggested.body, `${suggested.title} copied`)} className="mt-3">Copy Script</GhostButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {tab === 'intake' && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card title="Buyer Intake Form" subtitle="Public-facing buyer submission simulator.">
                <div className="grid gap-4 md:grid-cols-2">
                  <label><div className="mb-1 text-sm font-medium">Company</div><Input value={buyerIntakeForm.company} onChange={(e) => setBuyerIntakeForm({ ...buyerIntakeForm, company: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Contact</div><Input value={buyerIntakeForm.contact} onChange={(e) => setBuyerIntakeForm({ ...buyerIntakeForm, contact: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Email</div><Input value={buyerIntakeForm.email} onChange={(e) => setBuyerIntakeForm({ ...buyerIntakeForm, email: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Product</div><Input value={buyerIntakeForm.product} onChange={(e) => setBuyerIntakeForm({ ...buyerIntakeForm, product: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Volume</div><Input value={buyerIntakeForm.volume} onChange={(e) => setBuyerIntakeForm({ ...buyerIntakeForm, volume: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Destination / Geography</div><Input value={buyerIntakeForm.geography} onChange={(e) => setBuyerIntakeForm({ ...buyerIntakeForm, geography: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Terms</div><Input value={buyerIntakeForm.terms} onChange={(e) => setBuyerIntakeForm({ ...buyerIntakeForm, terms: e.target.value })} /></label>
                  <div className="md:col-span-2"><label><div className="mb-1 text-sm font-medium">Notes</div><Textarea value={buyerIntakeForm.notes} onChange={(e) => setBuyerIntakeForm({ ...buyerIntakeForm, notes: e.target.value })} /></label></div>
                  <div className="md:col-span-2"><Button onClick={submitBuyerIntake}>Submit Buyer Intake</Button></div>
                </div>
              </Card>

              <Card title="Seller Intake Form" subtitle="Public-facing seller submission simulator.">
                <div className="grid gap-4 md:grid-cols-2">
                  <label><div className="mb-1 text-sm font-medium">Company</div><Input value={sellerIntakeForm.company} onChange={(e) => setSellerIntakeForm({ ...sellerIntakeForm, company: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Contact</div><Input value={sellerIntakeForm.contact} onChange={(e) => setSellerIntakeForm({ ...sellerIntakeForm, contact: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Email</div><Input value={sellerIntakeForm.email} onChange={(e) => setSellerIntakeForm({ ...sellerIntakeForm, email: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Product</div><Input value={sellerIntakeForm.product} onChange={(e) => setSellerIntakeForm({ ...sellerIntakeForm, product: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Volume</div><Input value={sellerIntakeForm.volume} onChange={(e) => setSellerIntakeForm({ ...sellerIntakeForm, volume: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Origin / Geography</div><Input value={sellerIntakeForm.geography} onChange={(e) => setSellerIntakeForm({ ...sellerIntakeForm, geography: e.target.value })} /></label>
                  <label><div className="mb-1 text-sm font-medium">Terms</div><Input value={sellerIntakeForm.terms} onChange={(e) => setSellerIntakeForm({ ...sellerIntakeForm, terms: e.target.value })} /></label>
                  <div className="md:col-span-2"><label><div className="mb-1 text-sm font-medium">Notes</div><Textarea value={sellerIntakeForm.notes} onChange={(e) => setSellerIntakeForm({ ...sellerIntakeForm, notes: e.target.value })} /></label></div>
                  <div className="md:col-span-2"><Button onClick={submitSellerIntake}>Submit Seller Intake</Button></div>
                </div>
              </Card>
            </div>

            <Card title="Intake Inbox" subtitle="Review submissions and route them into your desk.">
              <div className="space-y-4">
                {intakeSubmissions.map((submission) => (
                  <div key={submission.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><strong>{submission.id}</strong><Badge>{submission.type}</Badge><Badge>{submission.status}</Badge></div>
                        <p className="mt-1 text-sm text-slate-500">{submission.company} • {submission.contact} • {submission.email}</p>
                        <p className="mt-1 text-xs text-slate-400">{submission.product} • {submission.volume} • {submission.geography} • {submission.terms}</p>
                        <p className="mt-2 text-sm text-slate-600">{submission.notes || 'No notes provided.'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <GhostButton onClick={() => copyText(submission.type === 'Buyer' ? scriptLibrary.buyerQualification.body : scriptLibrary.sellerQualification.body, 'Follow-up copied')}>Copy Follow-Up</GhostButton>
                        <GhostButton onClick={() => markIntakeReviewed(submission.id)}>Mark Reviewed</GhostButton>
                        <Button onClick={() => convertIntake(submission.id)}>Convert To Desk</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'scripts' && (
          <Card title="Desk Scripts" subtitle="Copy-ready communication scripts.">
            <div className="grid gap-4 lg:grid-cols-2">
              {Object.entries(scriptLibrary).map(([key, script]) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{script.title}</p>
                      <p className="mt-1 text-xs text-slate-400">Key: {key}</p>
                    </div>
                    <GhostButton onClick={() => copyText(script.body, `${script.title} copied`)}>Copy</GhostButton>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{script.body}</pre>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
