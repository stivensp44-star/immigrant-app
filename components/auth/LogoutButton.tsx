'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { clearServerSession } from '../../lib/auth/client'
import { supabase } from '../../lib/supabaseClient'

export function LogoutButton() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogout() {
    setIsSubmitting(true)

    try {
      await supabase.auth.signOut()
      await clearServerSession()
      router.replace('/login')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isSubmitting}
      style={{
        borderRadius: 10,
        border: '1px solid #cbd5e1',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        padding: '8px 12px',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
      }}
    >
      {isSubmitting ? 'Logging out...' : 'Log out'}
    </button>
  )
}
