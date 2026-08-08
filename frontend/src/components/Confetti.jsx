import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COLORS = ['#5B5FEF', '#A855F7', '#22D3EE', '#10B981', '#F59E0B', '#EC4899']

function makePieces(count) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 420,
    y: -(Math.random() * 260 + 120),
    rotate: Math.random() * 720 - 360,
    delay: Math.random() * 0.15,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 6,
    shape: Math.random() > 0.5 ? '50%' : '2px',
  }))
}

export default function Confetti({ active, count = 36, onDone }) {
  const pieces = useMemo(() => (active ? makePieces(count) : []), [active, count])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {active && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center overflow-visible">
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
              transition={{ duration: 1.1, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute', top: 0, left: '50%',
                width: p.size, height: p.size,
                background: p.color, borderRadius: p.shape,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
