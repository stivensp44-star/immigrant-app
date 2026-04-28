'use client'

import Link from 'next/link'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { supabase } from '../../../lib/supabaseClient'

type RecoveryOutcome =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; message: string }

const RESEND_COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [outcome, setOutcome] = useState<RecoveryOutcome>({ kind: 'idle' })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value)
    if (outcome.kind !== 'idle') setOutcome({ kind: 'idle' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isHydrated || isSubmitting || cooldown > 0) return
    const trimmed = email.trim()
    if (!trimmed) {
      setOutcome({ kind: 'error', message: 'Email is required.' })
      return
    }
    setIsSubmitting(true)
    try {
      const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      })
      if (error) throw error
      setOutcome({
        kind: 'success',
        message: 'If that email is registered, a recovery link has been sent.',
      })
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setOutcome({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to send recovery email.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const disableInputs = !isHydrated || isSubmitting

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '48px 16px' }}>
      <div style={{ margin: '0 auto', maxWidth: 420, display: 'grid', gap: 20 }}>
        <section
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
            display: 'grid',
            gap: 16,
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>
              Forgot your password?
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <fieldset
              disabled={disableInputs}
              style={{ border: 0, margin: 0, padding: 0, display: 'grid', gap: 16, minInlineSize: 0 }}
            >
              <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
                <span>Email</span>
                <input
                  autoComplete="email"
                  name="email"
                  required
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  style={inputStyles}
                />
              </label>

              <button
                type="submit"
                disabled={disableInputs || cooldown > 0}
                style={{
                  border: 0,
                  borderRadius: 10,
                  backgroundColor: disableInputs || cooldown > 0 ? '#94a3b8' : '#0f172a',
                  color: '#ffffff',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  cursor: disableInputs || cooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {!isHydrated
                  ? 'Loading...'
                  : isSubmitting
                    ? 'Sending...'
                    : cooldown > 0
                      ? `Resend (${cooldown}s)`
                      : 'Send recovery link'}
              </button>
            </fieldset>
          </form>

          {outcome.kind === 'success' ? (
            <p style={{ margin: 0, color: '#166534' }}>{outcome.message}</p>
          ) : null}

          {outcome.kind === 'error' ? (
            <p style={{ margin: 0, color: '#b91c1c' }}>{outcome.message}</p>
          ) : null}

          <p style={{ margin: 0, color: '#475569' }}>
            <Link href="/login" style={{ color: '#0f172a' }}>
              Back to log in
            </Link>
            {' · '}
            <Link href="/signup" style={{ color: '#0f172a' }}>
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

const inputStyles = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  padding: '12px 14px',
  fontSize: '1rem',
  backgroundColor: '#ffffff',
  color: '#0f172a',
} as const