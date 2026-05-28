'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export function PostHogIdentify({ userId, tier }: { userId: string; tier: string }) {
  useEffect(() => {
    posthog.identify(userId, { tier })
  }, [userId, tier])

  return null
}
