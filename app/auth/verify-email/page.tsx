'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { persistServerSession } from '../../../lib/auth/client'
import { supabase } from '../../../lib/supabaseClient'

type VerifyOutcome =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'info'; message: string }

const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = (searchParams.get('email') ?? '').trim()

  const [token, setToken] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [outcome, setOutcome] = useState<VerifyOutcome>({ kind: 'idle' })

  const disableInputs = !isHydrated || isSubmitting
  const hasEmail = email.length > 0

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  function handleTokenChange(event: ChangeEvent<HTMLInputElement>) {
    const cleaned = event.target.value.replace(/\D/g, '').slice(0, 6)
    setToken(cleaned)
    if (outcome.kind !== 'idle') setOutcome({ kind: 'idle' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disableInputs) return
    if (!hasEmail) {
      setOutcome({
        kind: 'error',
        message: 'Email parameter missing. Please sign up again.',
      })
      return
    }
    if (token.length !== 8) {
      setOutcome({ kind: 'error', message: 'Enter the 8-digit code from your email.' })
      return
    }
    setIsSubmitting(true)
    setOutcome({ kind: 'idle' })
    try {
      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp({ email, token, type: 'signup' }),
        15000,
        'Verification request timed out.'
      )
      if (error) throw error
      if (!data.session) throw new Error('Verification did not return a session.')
      await persistServerSession(
        data.session.access_token,
        data.session.refresh_token
      )
      router.replace('/')
      router.refresh()
    } catch (error) {
      setOutcome({ kind: 'error', message: toErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    if (isResending || resendCooldown > 0) return
    if (!hasEmail) {
      setOutcome({
        kind: 'error',
        message: 'Email parameter missing. Please sign up again.',
      })
      return
    }
    setIsResending(true)
    setOutcome({ kind: 'idle' })
    try {
      const { error } = await withTimeout(
        supabase.auth.resend({ type: 'signup', email }),
        15000,
        'Resend request timed out.'
      )
      if (error) throw error
      setOutcome({ kind: 'info', message: 'A new code has been sent to your email.' })
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setOutcome({ kind: 'error', message: toErrorMessage(error) })
    } finally {
      setIsResending(false)
    }
  }

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
              Verify your email
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>
              {hasEmail
                ? `Enter the 8-digit code we sent to ${email}.`
                : 'No email provided. Please sign up again.'}
            </p>
          </div>

          {hasEmail ? (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <fieldset
                disabled={disableInputs}
                style={{ border: 0, margin: 0, padding: 0, display: 'grid', gap: 16, minInlineSize: 0 }}
              >
                <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
                  <span>8-digit code</span>
                  <input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    name="token"
                    required
                    type="text"
                    value={token}
                    onChange={handleTokenChange}
                    maxLength={8}
                    style={{ ...inputStyles, letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.25rem' }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={disableInputs || token.length !== 8}
                  style={{
                    border: 0,
                    borderRadius: 10,
                    backgroundColor: disableInputs || token.length !== 8 ? '#94a3b8' : '#0f172a',
                    color: '#ffffff',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    cursor: disableInputs || token.length !== 8 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {!isHydrated ? 'Loading...' : isSubmitting ? 'Verifying...' : 'Verify'}
                </button>
              </fieldset>
            </form>
          ) : null}

          {outcome.kind === 'info' ? (
            <p style={{ margin: 0, color: '#166534' }}>{outcome.message}</p>
          ) : null}

          {outcome.kind === 'error' ? (
            <p style={{ margin: 0, color: '#b91c1c' }}>{outcome.message}</p>
          ) : null}

          {hasEmail ? (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending || resendCooldown > 0 || !isHydrated}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: '10px 16px',
                fontSize: '0.95rem',
                cursor:
                  isResending || resendCooldown > 0 || !isHydrated
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {isResending
                ? 'Sending...'
                : resendCooldown > 0
                  ? `Resend code (${resendCooldown}s)`
                  : 'Resend code'}
            </button>
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

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: number | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId)
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Unable to continue.'
}
