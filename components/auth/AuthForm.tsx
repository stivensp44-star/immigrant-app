'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { persistServerSession } from '../../lib/auth/client'
import { supabase } from '../../lib/supabaseClient'

type AuthFormMode = 'login' | 'signup'
type AuthFormProps = { mode: AuthFormMode }
type AuthMethod = 'email'
type AuthFormValues = {
  confirmEmail: string
  confirmPassword: string
  email: string
  password: string
}
type AuthOutcome =
  | { kind: 'idle' }
  | { email: string; kind: 'success'; message: string }
  | { kind: 'error'; message: string }

const initialFormValues: AuthFormValues = {
  confirmEmail: '',
  confirmPassword: '',
  email: '',
  password: '',
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [authMethod] = useState<AuthMethod>('email')
  const [isHydrated, setIsHydrated] = useState(false)
  const [formValues, setFormValues] = useState<AuthFormValues>(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<AuthOutcome>({ kind: 'idle' })

  const isSignup = mode === 'signup'
  const email = formValues.email.trim()
  const password = formValues.password
  const disableInputs = !isHydrated || isSubmitting || outcome.kind === 'success'

  useEffect(() => { setIsHydrated(true) }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isHydrated || isSubmitting) return
    await handleAuth()
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setFormValues((current) => ({ ...current, [name]: value }))
    if (outcome.kind !== 'idle') setOutcome({ kind: 'idle' })
  }

  async function handleAuth() {
    const validationError = getValidationError({ authMethod, formValues, isSignup })
    if (validationError) {
      setOutcome({ kind: 'error', message: validationError })
      return
    }
    setIsSubmitting(true)
    setOutcome({ kind: 'idle' })
    try {
      if (isSignup) {
        await handleSignup(email, password)
      } else {
        await handleLogin(email, password)
      }
    } catch (error) {
      setOutcome({ kind: 'error', message: toErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogin(email: string, password: string) {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      15000,
      'Authentication request timed out.'
    )
    if (error) throw error
    if (!data.session) throw new Error('Login succeeded without a session. Please try again.')
    await persistServerSession(data.session.access_token, data.session.refresh_token)
    router.replace('/')
    router.refresh()
  }

  async function handleSignup(email: string, password: string) {
    const emailRedirectTo = new URL('/auth/callback', window.location.origin).toString()
    const { data, error } = await withTimeout(
      supabase.auth.signUp({ email, password, options: { emailRedirectTo } }),
      15000,
      'Signup request timed out.'
    )
    if (error) throw error
    if (data.session) {
      await persistServerSession(data.session.access_token, data.session.refresh_token)
      router.replace('/')
      router.refresh()
      return
    }
    if (!data.user) throw new Error('Signup did not complete.')
    setFormValues((c) => ({ ...c, confirmPassword: '', password: '' }))
    setOutcome({
      kind: 'success',
      email,
      message: 'Account created. Check your email for the confirmation link before logging in.',
    })
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '48px 16px' }}>
      <div style={{ margin: '0 auto', maxWidth: 420, display: 'grid', gap: 20 }}>
        <section style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          display: 'grid',
          gap: 16,
        }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>
              {isSignup ? 'Vendor signup' : 'Vendor login'}
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>
              {isSignup
                ? 'Create a vendor account tied to your Supabase auth user.'
                : 'Log in to access vendor-scoped applicant data.'}
            </p>
          </div>

          <form method="post" onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <fieldset disabled={disableInputs} style={{ border: 0, margin: 0, padding: 0, display: 'grid', gap: 16, minInlineSize: 0 }}>
              <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
                <span>Email</span>
                <input autoComplete="email" name="email" required type="email" value={formValues.email} onChange={handleChange} style={inputStyles} />
              </label>

              {isSignup ? (
                <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
                  <span>Confirm email</span>
                  <input autoComplete="email" name="confirmEmail" required type="email" value={formValues.confirmEmail} onChange={handleChange} style={inputStyles} />
                </label>
              ) : null}

              <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
                <span>Password</span>
                <input autoComplete={isSignup ? 'new-password' : 'current-password'} name="password" required type="password" value={formValues.password} onChange={handleChange} style={inputStyles} />
              </label>

              {isSignup ? (
                <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
                  <span>Confirm password</span>
                  <input autoComplete="new-password" name="confirmPassword" required type="password" value={formValues.confirmPassword} onChange={handleChange} style={inputStyles} />
                </label>
              ) : null}

              <button type="submit" disabled={disableInputs} style={{
                border: 0, borderRadius: 10,
                backgroundColor: disableInputs ? '#94a3b8' : '#0f172a',
                color: '#ffffff', padding: '12px 16px', fontSize: '1rem',
                cursor: disableInputs ? 'not-allowed' : 'pointer',
              }}>
                {!isHydrated ? 'Loading...' : isSubmitting ? 'Working...' : isSignup ? 'Create account' : 'Log in'}
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
            {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link href={isSignup ? '/login' : '/signup'} style={{ color: '#0f172a' }}>
              {isSignup ? 'Log in' : 'Sign up'}
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

const inputStyles = {
  width: '100%', borderRadius: 10, border: '1px solid #cbd5e1',
  padding: '12px 14px', fontSize: '1rem', backgroundColor: '#ffffff', color: '#0f172a',
} as const

function getValidationError({ authMethod, formValues, isSignup }: { authMethod: AuthMethod; formValues: AuthFormValues; isSignup: boolean }): string | null {
  if (authMethod !== 'email') return 'Unsupported authentication method.'
  if (!formValues.email.trim()) return 'Email is required.'
  if (!formValues.password) return 'Password is required.'
  if (!isSignup) return null
  if (formValues.email.trim() !== formValues.confirmEmail.trim()) return 'Email addresses must match.'
  if (formValues.password !== formValues.confirmPassword) return 'Passwords must match.'
  return null
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
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
