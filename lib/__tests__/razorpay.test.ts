import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { verifyRazorpayWebhookSignature } from '../razorpay'

describe('verifyRazorpayWebhookSignature', () => {
  const secret = 'test-webhook-secret-abc123'
  const body = JSON.stringify({ event: 'subscription.activated', id: 'sub_test' })
  const validSig = createHmac('sha256', secret).update(body).digest('hex')

  it('returns true when signature matches body + secret', () => {
    expect(verifyRazorpayWebhookSignature(body, validSig, secret)).toBe(true)
  })

  it('returns false when body has been tampered with', () => {
    const tampered = body + ' '
    expect(verifyRazorpayWebhookSignature(tampered, validSig, secret)).toBe(false)
  })

  it('returns false when signature is wrong', () => {
    expect(verifyRazorpayWebhookSignature(body, 'deadbeef1234', secret)).toBe(false)
  })

  it('returns false when secret is wrong', () => {
    expect(verifyRazorpayWebhookSignature(body, validSig, 'wrong-secret')).toBe(false)
  })
})
