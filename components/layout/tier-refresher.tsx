'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Invisible component mounted in the protected layout (wraps every
 * authenticated route). Listens for tier/quota changes on the user's own
 * profile row and refreshes so the navbar badge and every page under this
 * layout stay in sync — without this, a shared layout only re-renders on a
 * hard reload, so an upgrade (or an admin edit) can leave the badge showing
 * the old tier indefinitely while navigating client-side.
 */
export function TierRefresher({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`tier:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router])

  return null
}
