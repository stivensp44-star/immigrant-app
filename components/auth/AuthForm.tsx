'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { persistServerSession } from '../../lib/auth/client'
import { supabase } from '../../lib/supabaseClient'

type AuthFormMode = 'login' | 'signup'

type AuthFormProps = {
  mode: AuthFormMode
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const isSignup = mode === 'signup'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      const { data, error } = isSignup
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })

      if (error) {
        throw error
      }

      if (!data.session) {
        setStatusMessage(
          'Account created. Confirm the email if required, then log in.'
        )
        return
      }

      await persistServerSession(
        data.session.access_token,
        data.session.refresh_token
      )

      router.replace('/')
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to continue.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '48px 16px',
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: 420,
          display: 'grid',
          gap: 20,
        }}
      >
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
              {isSignup ? 'Vendor signup' : 'Vendor login'}
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>
              {isSignup
                ? 'Create a vendor account tied to your Supabase auth user.'
                : 'Log in to access vendor-scoped applicant data.'}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'grid', gap: 16 }}
          >
            <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={inputStyles}
              />
            </label>

            <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
              <span>Password</span>
              <input
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                name="password"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={inputStyles}
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                border: 0,
                borderRadius: 10,
                backgroundColor: isSubmitting ? '#94a3b8' : '#0f172a',
                color: '#ffffff',
                padding: '12px 16px',
                fontSize: '1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting
                ? 'Working...'
                : isSignup
                  ? 'Create account'
                  : 'Log in'}
            </button>
          </form>

          {statusMessage ? (
            <p style={{ margin: 0, color: '#166534' }}>{statusMessage}</p>
          ) : null}

          {errorMessage ? (
            <p style={{ margin: 0, color: '#b91c1c' }}>{errorMessage}</p>
          ) : null}

          <p style={{ margin: 0, color: '#475569' }}>
            {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link
              href={isSignup ? '/login' : '/signup'}
              style={{ color: '#0f172a' }}
            >
              {isSignup ? 'Log in' : 'Sign up'}
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
