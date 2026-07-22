import { useState, useRef } from 'react'

const CHART_HEIGHT = 180
const CHART_PAD_TOP = 16


export default function MonthlyTrendChart({ data }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const svgRef = useRef(null)

  const max = Math.max(...data.map((d) => d.count), 1)
  const n = data.length
  const w = 1000
  const h = CHART_HEIGHT
  const usableH = h - CHART_PAD_TOP
  const stepX = n > 1 ? w / (n - 1) : 0

  const points = data.map((d, i) => ({
    ...d,
    x: i * stepX,
    y: CHART_PAD_TOP + usableH * (1 - d.count / max),
  }))

  const smoothPath = (pts) => {
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2] || p2
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return d
  }

  const linePath = smoothPath(points)
  const areaPath = `${linePath} L ${points[n - 1].x} ${h} L ${points[0].x} ${h} Z`

  const handleMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * w
    let nearest = 0
    let best = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX)
      if (dist < best) { best = dist; nearest = i }
    })
    setHoverIdx(nearest)
  }

  const active = hoverIdx !== null ? points[hoverIdx] : null

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full cursor-crosshair"
        style={{ height: CHART_HEIGHT }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C6BFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7C6BFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1="0" y1={h - 0.5} x2={w} y2={h - 0.5} stroke="#FFFFFF" strokeOpacity="0.06" strokeWidth="1" />

        <path d={areaPath} fill="url(#trendAreaFill)" />
        <path d={linePath} fill="none" stroke="#7C6BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {active && (
          <>
            <line x1={active.x} y1={CHART_PAD_TOP} x2={active.x} y2={h} stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
            <circle cx={active.x} cy={active.y} r="8" fill="#7C6BFF" fillOpacity="0.15" />
            <circle cx={active.x} cy={active.y} r="4.5" fill="#7C6BFF" stroke="#0B0C14" strokeWidth="2" />
          </>
        )}

        {hoverIdx === null && points.map((p) => p.isCurrent && (
          <circle key={p.fullLabel} cx={p.x} cy={p.y} r="4.5" fill="#7C6BFF" stroke="#0B0C14" strokeWidth="2" />
        ))}

        {points.map((p, i) => (
          <rect key={p.fullLabel} x={i === 0 ? 0 : p.x - stepX / 2} y="0"
            width={stepX || w} height={h} fill="transparent"
            onMouseEnter={() => setHoverIdx(i)} />
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-[#14151F] px-3 py-2 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]"
          style={{
            left: `${(active.x / w) * 100}%`,
            top: Math.max((active.y / h) * CHART_HEIGHT - 62, 0),
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">{active.fullLabel}</p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {active.count} <span className="font-medium text-white/50">application{active.count !== 1 ? 's' : ''}</span>
          </p>
        </div>
      )}

      <div className="mt-3 flex" style={{ paddingLeft: 0 }}>
        {points.map((p, i) => (
          <span
            key={p.fullLabel}
            className={`flex-1 text-center text-[11px] font-medium transition-colors duration-200 ${
              p.isCurrent || hoverIdx === i ? 'text-app-viz-soft font-semibold' : 'text-white/30'
            }`}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
