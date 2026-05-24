import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }>
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div
        className="max-w-md w-full text-center p-10 rounded-2xl"
        style={{
          backgroundColor: 'rgba(8,13,26,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(249,193,37,0.20)',
        }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1.5px solid rgba(239,68,68,0.40)',
          }}
        >
          <ShieldOff className="h-8 w-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/60 text-sm mb-8">
          You don&apos;t have permission to view this page. This could be because the
          resource doesn&apos;t exist, belongs to another account, or requires a
          higher-tier plan.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <button className="w-full sm:w-auto rounded-xl bg-[#F9C125] px-6 py-3 text-sm font-bold text-[#080d1a] shadow-lg shadow-[#F9C125]/20 hover:brightness-110 transition-all">
              Go to Dashboard
            </button>
          </Link>
          <Link href="/session/setup">
            <button className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              Start a New Session
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
