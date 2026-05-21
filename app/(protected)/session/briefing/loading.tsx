function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
}

export default function BriefingLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div
        className="w-full max-w-xl p-8"
        style={{
          backgroundColor: 'rgba(28,10,0,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(249,193,37,0.20)',
          borderRadius: '1.25rem',
        }}
      >
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-6 h-7 w-48" />
        <div className="space-y-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <Skeleton className="h-5 flex-1" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}
