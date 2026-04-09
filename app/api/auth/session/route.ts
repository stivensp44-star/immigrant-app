import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  authCookieOptions,
} from '../../../../lib/auth/session'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function createServerSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { accessToken?: string; refreshToken?: string }
    | null

  if (!payload?.accessToken || !payload.refreshToken) {
    return NextResponse.json({ error: 'Missing session tokens.' }, { status: 400 })
  }

  const supabase = createServerSupabase()

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession(
    {
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken,
    }
  )

  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unable to load user.' }, { status: 401 })
  }

  const { error: vendorError } = await supabase
    .from('vendors')
    .upsert({ id: userData.user.id })

  if (vendorError) {
    return NextResponse.json(
      { error: 'Unable to ensure vendor record.' },
      { status: 500 }
    )
  }

  const cookieStore = await cookies()
  cookieStore.set(AUTH_ACCESS_TOKEN_COOKIE, sessionData.session.access_token, {
    ...authCookieOptions,
    maxAge: sessionData.session.expires_in,
  })
  cookieStore.set(AUTH_REFRESH_TOKEN_COOKIE, sessionData.session.refresh_token, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_ACCESS_TOKEN_COOKIE)
  cookieStore.delete(AUTH_REFRESH_TOKEN_COOKIE)

  return NextResponse.json({ ok: true })
}

