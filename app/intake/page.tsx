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

export default function Page() {
  const [form, setForm] = useState<FormState>(initialBuyerState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function switchType(type: IntakeType) {
    setForm(type === 'Buyer' ? initialBuyerState : initialSellerState)
    setMessage('')
    setError('')
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

      const { error } = await supabase.from('intake_submissions').insert([
        {
          ...form,
          status: 'New',
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      setMessage('Submission successful')
      setForm(form.type === 'Buyer' ? initialBuyerState : initialSellerState)
    } catch (err: any) {
      setError(err.message || 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Fuel Intake</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => switchType('Buyer')}>Buyer</button>
        <button onClick={() => switchType('Seller')} style={{ marginLeft: 10 }}>
          Seller
        </button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <input placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
        <input placeholder="Volume" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
        <input placeholder="Geography" value={form.geography} onChange={(e) => setForm({ ...form, geography: e.target.value })} />
        <input placeholder="Terms" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </main>
  )
}
