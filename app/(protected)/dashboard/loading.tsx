const CARD = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40 mb-1" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* CTA button */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      {/* Info row — sessions + profile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4" style={CARD}>
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-8 w-16 mb-3" />
          <Skeleton className="h-1.5 w-full rounded-full mb-1.5" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="p-4" style={CARD}>
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-5 w-36 mb-2" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-4"
              style={CARD}
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right space-y-1 hidden sm:block">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-8" />
                </div>
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress section */}
      <div className="p-6" style={CARD}>
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="p-5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,193,37,0.12)' }}>
              <Skeleton className="h-3 w-36 mb-3" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
