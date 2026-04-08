'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type IntakeType = 'Buyer' | 'Seller'

type FormState = {
  type: IntakeType
  company: string
  contact: string
  email: string
  product: string
  volume: string
  geography: string
  terms: string
  notes: string
}

const initialBuyerState: FormState = {
  type: 'Buyer',
  company: '',
  contact: '',
  email: '',
  product: 'EN590 10ppm',
  volume: '',
  geography: '',
  terms: 'CIF / LC',
  notes: '',
}

const initialSellerState: FormState = {
  type: 'Seller',
  company: '',
  contact: '',
  email: '',
  product: 'EN590 10ppm',
  volume: '',
  geography: '',
  terms: 'FOB / CIF',
  notes: '',
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${props.className || ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[130px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${props.className || ''}`}
    />
  )
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${props.className || ''}`}
    />
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  )
}

export default function PublicIntakePage() {
  const [form, setForm] = useState<FormState>(initialBuyerState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function switchType(type: IntakeType) {
    setMessage('')
    setError('')
    setForm(type === 'Buyer' ? initialBuyerState : initialSellerState)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!form.company || !form.contact || !form.email) {
      setError('Company, contact, and email are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const payload = {
        type: form.type,
        company: form.company,
        contact: form.contact,
        email: form.email,
        product: form.product,
        volume: form.volume,
        geography: form.geography,
        terms: form.terms,
        notes: form.notes,
        status: 'New',
        created_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase
        .from('intake_submissions')
        .insert([payload])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setMessage(
        form.type === 'Buyer'
          ? 'Buyer intake submitted successfully.'
          : 'Seller intake submitted successfully.'
      )

      setForm(form.type === 'Buyer' ? initialBuyerState : initialSellerState)
    } catch (err: any) {
      setError(err?.message || 'Submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-200">
                OFarming
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                Fuel Buyer & Seller Intake
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Submit your request or offer for private review. We use this form
                to evaluate active buying requirements and supplier-side
                availability for transactions involving products such as EN590
                and related fuel allocations.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-300 md:text-sm">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Private submission flow
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Buyer / seller review
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Stored securely in pipeline
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="text-sm font-semibold text-white">
                What to expect
              </div>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div>
                  <div className="font-medium text-white">1. Submit details</div>
                  <div className="mt-1">
                    Provide your company, contact, product, terms, and volume.
                  </div>
                </div>
                <div>
                  <div className="font-medium text-white">2. Review</div>
                  <div className="mt-1">
                    Your submission is routed into a private intake pipeline for
                    review and qualification.
                  </div>
                </div>
                <div>
                  <div className="font-medium text-white">3. Follow-up</div>
                  <div className="mt-1">
                    If aligned, next steps may include commercial follow-up and
                    transaction procedure review.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => switchType('Buyer')}
            className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
              form.type === 'Buyer'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Buyer Intake
          </button>

          <button
            type="button"
            onClick={() => switchType('Seller')}
            className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
              form.type === 'Seller'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Seller Intake
          </button>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {form.type === 'Buyer' ? 'Buyer Submission' : 'Seller Submission'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {form.type === 'Buyer'
                  ? 'Use this form to submit an active buying requirement.'
                  : 'Use this form to submit supplier-side product availability.'}
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Private review only
            </div>
          </div>

          {message ? (
            <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <Field label="Company">
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company name"
              />
            </Field>

            <Field label="Contact">
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Full name or desk"
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@company.com"
              />
            </Field>

            <Field label="Product">
              <Input
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                placeholder="EN590 10ppm"
              />
            </Field>

            <Field label="Volume">
              <Input
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                placeholder="100,000 MT / month"
              />
            </Field>

            <Field label={form.type === 'Buyer' ? 'Destination / Geography' : 'Origin / Geography'}>
              <Input
                value={form.geography}
                onChange={(e) => setForm({ ...form, geography: e.target.value })}
                placeholder={form.type === 'Buyer' ? 'Tema Port, Ghana' : 'Rotterdam'}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Terms">
                <Input
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  placeholder={form.type === 'Buyer' ? 'CIF / LC' : 'FOB / CIF'}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Notes">
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Anything important we should know before review?"
                />
              </Field>
            </div>

            <div className="md:col-span-2 flex flex-col gap-4 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="max-w-2xl text-xs leading-5 text-slate-500">
                This form routes submissions into a private intake pipeline for
                internal review. Submission does not guarantee transaction
                acceptance, product allocation, or procedural approval.
              </p>

              <Button type="submit" disabled={isSubmitting} className="min-w-[180px]">
                {isSubmitting ? 'Submitting...' : `Submit ${form.type} Intake`}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}