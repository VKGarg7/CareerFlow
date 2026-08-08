export default function AvatarRing({ initial, size = 32, className = '' }) {
  const ringSize = size + 6
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: ringSize, height: ringSize }}>
      <div
        className="absolute inset-0 animate-spin-slow rounded-full opacity-90"
        style={{
          background: 'conic-gradient(from 0deg, #5B5FEF, #A855F7, #22D3EE, #10B981, #5B5FEF)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))',
        }}
      />
      <div
        className="icon-embossed absolute inset-[3px] flex items-center justify-center rounded-full bg-gradient-to-br from-app-accent to-app-purple text-white shadow-inner-highlight"
        style={{ fontSize: size * 0.34, fontWeight: 700 }}
      >
        {initial}
      </div>
    </div>
  )
}
