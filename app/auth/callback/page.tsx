'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { persistServerSession } from '../../../lib/auth/client'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    void completeAuth()
  }, [searchParams])

  async function completeAuth() {
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    try {
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          throw error
        }

        if (!data.session) {
          throw new Error('Email confirmation did not return a session.')
        }

        await persistServerSession(
          data.session.access_token,
          data.session.refresh_token
        )

        router.replace('/')
        router.refresh()
        return
      }

      if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'signup' | 'email_change' | 'recovery' | 'invite' | 'magiclink',
        })

        if (error) {
          throw error
        }

        if (!data.session) {
          throw new Error('Email confirmation did not return a session.')
        }

        await persistServerSession(
          data.session.access_token,
          data.session.refresh_token
        )

        router.replace('/')
        router.refresh()
        return
      }

      throw new Error('Missing auth confirmation parameters.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to complete auth.'
      )
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
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        }}
      >
        <p style={{ margin: 0, color: errorMessage ? '#b91c1c' : '#475569' }}>
          {errorMessage || 'Completing sign-in...'}
        </p>
      </div>
    </main>
  )
}

