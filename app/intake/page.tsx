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
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-[110px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
    />
  )
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
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
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white">
          <h1 className="text-3xl font-semibold">Fuel Buyer / Seller Intake</h1>
          <p className="mt-2 text-sm text-slate-300">
            Submit your request or offer for review.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => switchType('Buyer')}
            className={`rounded px-4 py-2 ${
              form.type === 'Buyer'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            Buyer
          </button>
          <button
            type="button"
            onClick={() => switchType('Seller')}
            className={`rounded px-4 py-2 ${
              form.type === 'Seller'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            Seller
          </button>
        </div>

        {message && <div className="mb-4 text-green-600">{message}</div>}
        {error && <div className="mb-4 text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <Input
            placeholder="Contact"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="Product"
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
          />
          <Input
            placeholder="Volume"
            value={form.volume}
            onChange={(e) => setForm({ ...form, volume: e.target.value })}
          />
          <Input
            placeholder="Geography"
            value={form.geography}
            onChange={(e) => setForm({ ...form, geography: e.target.value })}
          />
          <Input
            placeholder="Terms"
            value={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.value })}
          />
          <Textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </div>
    </main>
  )
}