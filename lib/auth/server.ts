import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  authCookieOptions,
} from './session'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type VendorSession = {
  email: string | null
  userId: string
}

function createServerSupabase(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  })
}

export async function createAuthenticatedServerSupabase() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(AUTH_ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value

  if (!accessToken || !refreshToken) {
    return null
  }

  const supabase = createServerSupabase(accessToken)
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error || !data.session) {
    return null
  }

  if (data.session.access_token !== accessToken) {
    const cookieStore = await cookies()
    cookieStore.set(AUTH_ACCESS_TOKEN_COOKIE, data.session.access_token, {
      ...authCookieOptions,
      maxAge: data.session.expires_in,
    })
    cookieStore.set(AUTH_REFRESH_TOKEN_COOKIE, data.session.refresh_token, {
      ...authCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return supabase
}

export const getVendorSession = cache(async (): Promise<VendorSession | null> => {
  const supabase = await createAuthenticatedServerSupabase()

  if (!supabase) {
    return null
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return null
  }

  return {
    email: userData.user.email ?? null,
    userId: userData.user.id,
  }
})

export async function requireVendorSession(): Promise<VendorSession> {
  const session = await getVendorSession()

  if (!session) {
    redirect('/login')
  }

  return session
}
