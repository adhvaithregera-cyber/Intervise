'use client'

import { useEffect } from 'react'

export function PostHogIdentify({ userId, tier }: { userId: string; tier: string }) {
  useEffect(() => {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.identify(userId, { tier })
    })
  }, [userId, tier])

  return null
}
