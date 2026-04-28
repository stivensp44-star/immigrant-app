'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { supabase } from '../../../lib/supabaseClient'

type ResetOutcome =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; message: string }

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<ResetOutcome>({ kind: 'idle' })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasRecoverySession(true)
        setIsCheckingSession(false)
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecoverySession(true)
      setIsCheckingSession(false)
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value)
    if (outcome.kind !== 'idle') setOutcome({ kind: 'idle' })
  }

  function handleConfirmChange(event: ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(event.target.value)
    if (outcome.kind !== 'idle') setOutcome({ kind: 'idle' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isHydrated || isSubmitting) return
    if (password.length < 8) {
      setOutcome({ kind: 'error', message: 'Password must be at least 8 characters.' })
      return
    }
    if (password !== confirmPassword) {
      setOutcome({ kind: 'error', message: 'Passwords must match.' })
      return
    }
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setOutcome({
        kind: 'success',
        message: 'Password updated. Redirecting to login...',
      })
      await supabase.auth.signOut()
      setTimeout(() => {
        router.replace('/login')
      }, 1500)
    } catch (error) {
      setOutcome({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to update password.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const disableInputs = !isHydrated || isSubmitting || outcome.kind === 'success'

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
              Set a new password
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>
              {isCheckingSession
                ? 'Verifying recovery link...'
                : hasRecoverySession
                  ? 'Enter and confirm your new password.'
                  : 'This link is invalid or expired. Please request a new password recovery email.'}
            </p>
          </div>

          {!isCheckingSession && hasRecoverySession ? (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <fieldset
                disabled={disableInputs}
                style={{ border: 0, margin: 0, padding: 0, display: 'grid', gap: 16, minInlineSize: 0 }}
              >
                <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
                  <span>New password</span>
                  <input
                    autoComplete="new-password"
                    name="password"
                    required
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    style={inputStyles}
                  />
                </label>

                <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
                  <span>Confirm new password</span>
                  <input
                    autoComplete="new-password"
                    name="confirmPassword"
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmChange}
                    style={inputStyles}
                  />
                </label>

                <button
                  type="submit"
                  disabled={disableInputs}
                  style={{
                    border: 0,
                    borderRadius: 10,
                    backgroundColor: disableInputs ? '#94a3b8' : '#0f172a',
                    color: '#ffffff',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    cursor: disableInputs ? 'not-allowed' : 'pointer',
                  }}
                >
                  {!isHydrated ? 'Loading...' : isSubmitting ? 'Updating...' : 'Update password'}
                </button>
              </fieldset>
            </form>
          ) : null}

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
            <Link href="/auth/forgot-password" style={{ color: '#0f172a' }}>
              Request new recovery email
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