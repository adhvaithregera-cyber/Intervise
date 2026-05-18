export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #FEFDF0 0%, #6BA3C8 100%)' }}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
