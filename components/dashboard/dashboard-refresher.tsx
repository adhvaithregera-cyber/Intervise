'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Invisible client component that keeps the dashboard in sync with the DB
 * in real time. Subscribes to Supabase Realtime on the current user's
 * sessions. On any change (session completed, quota updated) it calls
 * router.refresh() so the Server Component re-fetches and the UI reflects
 * the latest data without a full page reload. Profile/tier changes are
 * handled globally by TierRefresher in the protected layout.
 */
export function DashboardRefresher({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`dashboard:${userId}`)
      // Session changes — covers new completion, status updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `user_id=eq.${userId}`,
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
