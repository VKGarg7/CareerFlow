import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function GlowTrail({ children, className = '', color = 'rgba(91,95,239,0.16)' }) {
  const ref = useRef(null)
  const y = useMotionValue(0)
  const opacity = useMotionValue(0)
  const springY = useSpring(y, { stiffness: 300, damping: 30 })
  const springOpacity = useSpring(opacity, { stiffness: 300, damping: 30 })

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    y.set(e.clientY - rect.top)
  }

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMove}
      onMouseEnter={() => opacity.set(1)}
      onMouseLeave={() => opacity.set(0)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 h-12 -translate-y-1/2 rounded-2xl blur-xl"
        style={{ top: springY, opacity: springOpacity, background: color }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
