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

export default function SetupLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Skeleton className="mb-2 h-8 w-56" />
      <Skeleton className="mb-10 h-4 w-80" />

      <Skeleton className="mb-4 h-5 w-24" />
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={CARD} className="p-5">
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      <Skeleton className="mb-4 h-5 w-28" />
      <div style={CARD} className="mb-8 p-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-4 h-9 w-44 rounded-xl" />
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}
