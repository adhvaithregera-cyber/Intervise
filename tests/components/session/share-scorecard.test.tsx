import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ShareScorecard } from '@/components/session/share-scorecard'

const SESSION_ID = 'test-session-123'
const OG_URL_PATH = `/api/og/scorecard/${SESSION_ID}`

describe('ShareScorecard', () => {
  beforeEach(() => {
    // Mock clipboard API via stubGlobal so it can be overridden per-test
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })

    // Spy on URL static methods instead of replacing the constructor
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

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
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining(OG_URL_PATH)
      )
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
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
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

    // Advance all timers to trigger the setTimeout reset
    act(() => { vi.runAllTimers() })

    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copied!/i })).not.toBeInTheDocument()
  })

  // Test 6: Fallback to window.prompt when clipboard API is unavailable
  it('falls back to window.prompt when clipboard API is unavailable', async () => {
    // Override navigator stub to remove clipboard
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: undefined as unknown as Clipboard,
    })
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => null)

    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))

    await waitFor(() => {
      expect(promptSpy).toHaveBeenCalledWith('Copy link:', expect.stringContaining(OG_URL_PATH))
    })
  })

  // Test 7: Close button hides sub-buttons and resets to collapsed state
  it('close button collapses sub-buttons back to initial state', () => {
    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))

    // Sub-buttons should be visible now
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()

    // Click the close button using exact aria-label
    fireEvent.click(screen.getByRole('button', { name: 'close' }))

    // Sub-buttons should be hidden
    expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /download png/i })).not.toBeInTheDocument()
  })

  // Test 8: Download PNG fetches the correct URL and triggers download
  it('calls fetch with the OG URL and triggers download on Download PNG click', async () => {
    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    fireEvent.click(screen.getByRole('button', { name: /download png/i }))
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining(OG_URL_PATH))
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  // Test 9: Download PNG is silent on fetch failure
  it('is silent when fetch fails during download', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'))
    render(<ShareScorecard sessionId={SESSION_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    // Should not throw
    fireEvent.click(screen.getByRole('button', { name: /download png/i }))
    await waitFor(() => {
      expect(URL.createObjectURL).not.toHaveBeenCalled()
    })
  })
})
