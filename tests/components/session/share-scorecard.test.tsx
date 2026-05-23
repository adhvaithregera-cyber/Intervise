import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ShareScorecard } from '@/components/session/share-scorecard'

const SESSION_ID = 'test-session-123'
const OG_URL = `https://intervise-ashen.vercel.app/api/og/scorecard/${SESSION_ID}`

describe('ShareScorecard', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    })

    // Mock URL methods
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    })

    // Mock fetch for download
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['img'], { type: 'image/png' })),
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  // Test 1: Renders a "Share" button in collapsed state
  it('renders a Share button in collapsed state', () => {
    render(<ShareScorecard sessionId={SESSION_ID} />)
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /download png/i })).not.toBeInTheDocument()
  })

  // Test 2: Clicking "Share" expands to show sub-buttons
  it('clicking Share expands to show Copy Link and Download PNG buttons', () => {
    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download png/i })).toBeInTheDocument()
  })

  // Test 3: "Copy Link" calls navigator.clipboard.writeText with the correct URL
  it('Copy Link calls clipboard.writeText with the correct OG URL', async () => {
    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(OG_URL)
    })
  })

  // Test 4: After clicking "Copy Link", button label changes to "Copied!"
  it('shows Copied! label after clicking Copy Link', async () => {
    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()
    })
  })

  // Test 5: After 2 seconds, "Copied!" resets to "Copy Link"
  it('resets Copied! label back to Copy Link after 2 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // Re-mock clipboard so its Promise resolves despite fake timers
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    })

    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))

    // Click and let microtasks flush
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
      // flush pending microtasks/promises
      await Promise.resolve()
    })

    // "Copied!" should show now
    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()

    // Advance clock by 2 s to trigger the setTimeout reset
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copied!/i })).not.toBeInTheDocument()
  })

  // Test 6: Fallback to window.prompt when clipboard API is unavailable
  it('falls back to window.prompt when clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
    })
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => null)

    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))

    await waitFor(() => {
      expect(promptSpy).toHaveBeenCalledWith('Copy link:', OG_URL)
    })
  })

  // Test 7: Close button hides sub-buttons and resets to collapsed state
  it('close button collapses sub-buttons back to initial state', () => {
    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))

    // Sub-buttons should be visible now
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()

    // Click the close/collapse button
    fireEvent.click(screen.getByRole('button', { name: /close|×|collapse/i }))

    // Sub-buttons should be hidden
    expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /download png/i })).not.toBeInTheDocument()
  })
})
