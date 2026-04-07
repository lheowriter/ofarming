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
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 ${props.className || ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[110px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 ${props.className || ''}`}
    />
  )
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${props.className || ''}`}
    />
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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">
            OFarming Intake
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Fuel Buyer / Seller Intake
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Submit your request or offer for review. This page does not expose our internal desk,
            pipeline, or private data.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => switchType('Buyer')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              form.type === 'Buyer'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            Buyer Intake
          </button>
          <button
            type="button"
            onClick={() => switchType('Seller')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              form.type === 'Seller'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            Seller Intake
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {form.type === 'Buyer' ? 'Buyer Submission' : 'Seller Submission'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {form.type === 'Buyer'
                ? 'Use this form to submit a fuel buying requirement.'
                : 'Use this form to submit a fuel supply offer.'}
            </p>
          </div>

          {message ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label>
              <div className="mb-1 text-sm font-medium text-slate-700">Company</div>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company name"
              />
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-slate-700">Contact</div>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Full name or desk"
              />
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-slate-700">Email</div>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@company.com"
              />
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-slate-700">Product</div>
              <Input
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                placeholder="EN590 10ppm"
              />
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-slate-700">Volume</div>
              <Input
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                placeholder="100,000 MT / month"
              />
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-slate-700">
                {form.type === 'Buyer' ? 'Destination / Geography' : 'Origin / Geography'}
              </div>
              <Input
                value={form.geography}
                onChange={(e) => setForm({ ...form, geography: e.target.value })}
                placeholder={form.type === 'Buyer' ? 'Tema Port, Ghana' : 'Rotterdam'}
              />
            </label>

            <label className="md:col-span-2">
              <div className="mb-1 text-sm font-medium text-slate-700">Terms</div>
              <Input
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                placeholder={form.type === 'Buyer' ? 'CIF / LC' : 'FOB / CIF'}
              />
            </label>

            <label className="md:col-span-2">
              <div className="mb-1 text-sm font-medium text-slate-700">Notes</div>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Anything important we should know before review?"
              />
            </label>

            <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                Submission goes to a private review inbox. It does not expose your data publicly.
              </p>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : `Submit ${form.type} Intake`}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}