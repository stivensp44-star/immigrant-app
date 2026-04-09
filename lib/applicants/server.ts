import 'server-only'

import { notFound } from 'next/navigation'

import { createAuthenticatedServerSupabase, requireVendorSession } from '../auth/server'

export async function requireAccessibleApplicant(
  applicantId: number | string
): Promise<void> {
  const session = await requireVendorSession()
  const supabase = await createAuthenticatedServerSupabase()

  if (!supabase) {
    notFound()
  }

  const { data, error } = await supabase
    .from('applicants')
    .select('id')
    .eq('id', applicantId)
    .eq('vendor_id', session.userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    notFound()
  }
}
