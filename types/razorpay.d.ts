interface RazorpayOptions {
  key: string
  subscription_id: string
  name?: string
  description?: string
  handler?: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  theme?: {
    color?: string
  }
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  on(event: 'payment.failed', handler: (response: { error: { description: string } }) => void): void
  open(): void
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor
  }
}

export {}
