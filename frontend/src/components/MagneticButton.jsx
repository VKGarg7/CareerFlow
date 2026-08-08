import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import useHoverSound from '../hooks/useHoverSound'

export default function MagneticButton({ children, className = '', strength = 14, sound = true, as: Comp = motion.button, ...rest }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.5 })
  const playHover = useHoverSound(sound)

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    x.set((relX / rect.width) * strength)
    y.set((relY / rect.height) * strength)
  }

  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <Comp
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={playHover}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.94 }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  )
}
