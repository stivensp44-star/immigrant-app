import { redirect } from 'next/navigation'

import { AuthForm } from '../../components/auth/AuthForm'
import { getVendorSession } from '../../lib/auth/server'

export default async function LoginPage() {
  const session = await getVendorSession()

  if (session) {
    redirect('/')
  }

  return <AuthForm mode="login" />
}

