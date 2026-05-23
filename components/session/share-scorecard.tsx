'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ShareScorecardProps {
  sessionId: string
}

export function ShareScorecard({ sessionId }: ShareScorecardProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const url = `${window.location.origin}/api/og/scorecard/${sessionId}`

  function handleOpen() {
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setCopied(false)
  }

  async function handleCopyLink() {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCopied(false), 2000)
        setCopied(true)
      } catch {
        window.prompt('Copy link:', url)
      }
    } else {
      window.prompt('Copy link:', url)
    }
  }

  async function handleDownload() {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('fetch failed')
      const blob = await response.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = 'intervise-scorecard.png'
      a.click()
      URL.revokeObjectURL(href)
    } catch {
      // Silent on failure
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="md" onClick={handleOpen}>
        <svg
          className="h-4 w-4 mr-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Share
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="md" onClick={handleCopyLink}>
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
      <Button variant="outline" size="md" onClick={handleDownload}>
        Download PNG
      </Button>
      <Button variant="ghost" size="md" onClick={handleClose} aria-label="close">
        ×
      </Button>
    </div>
  )
}
