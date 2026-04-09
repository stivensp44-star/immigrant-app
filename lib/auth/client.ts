export async function persistServerSession(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const response = await fetch('/api/auth/session', {
    body: JSON.stringify({
      accessToken,
      refreshToken,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null

    throw new Error(payload?.error ?? 'Unable to persist session.')
  }
}

export async function clearServerSession(): Promise<void> {
  const response = await fetch('/api/auth/session', {
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null

    throw new Error(payload?.error ?? 'Unable to clear session.')
  }
}

