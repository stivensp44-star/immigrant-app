'use client'

import { useEffect } from 'react'

import { Session } from '@supabase/supabase-js'

import { clearServerSession, persistServerSession } from '../../lib/auth/client'
import { supabase } from '../../lib/supabaseClient'

export function AuthSessionSync() {
  useEffect(() => {
    let cancelled = false

    void syncInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) {
        return
      }

      void syncServerCookies(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return null
}

async function syncInitialSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    await clearServerSession().catch(() => {})
    return
  }

  await syncServerCookies(data.session)
}

async function syncServerCookies(session: Session | null) {
  if (!session) {
    await clearServerSession().catch(() => {})
    return
  }

  await persistServerSession(session.access_token, session.refresh_token).catch(
    () => {}
  )
}

