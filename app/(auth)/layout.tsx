export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #EDE8F5 0%, #ADBBDA 100%)' }}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
