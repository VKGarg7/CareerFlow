export default function Skeleton({ className = '', rounded = 'rounded-lg' }) {
  return (
    <div
      className={`relative overflow-hidden bg-white/[0.05] ${rounded} ${className}`}
    >
      <div
        className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.09] to-transparent bg-[length:200%_100%]"
      />
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '', lastLineWidth = '60%' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3" rounded="rounded-md"
          {...(i === lines - 1 ? { style: { width: lastLineWidth } } : {})} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-surface glass-edge rounded-hud p-5 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" rounded="rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" rounded="rounded-md" />
          <Skeleton className="h-2.5 w-1/3" rounded="rounded-md" />
        </div>
      </div>
    </div>
  )
}
