import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function TiltCard({
  children,
  className = '',
  as: Wrapper = motion.div,
  maxTilt = 8,
  liftZ = 18,
  scaleOnHover = 1.015,
  glare = true,
  onClick,
  style,
  ...rest
}) {
  const ref = useRef(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  const springCfg = { stiffness: 260, damping: 22, mass: 0.6 }
  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), springCfg)
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), springCfg)
  const translateZ = useSpring(0, springCfg)
  const glareX = useTransform(px, [0, 1], ['10%', '90%'])
  const glareY = useTransform(py, [0, 1], ['10%', '90%'])

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  const glareOpacity = useSpring(0, springCfg)
  const handleEnter = () => {
    translateZ.set(liftZ)
    glareOpacity.set(1)
  }
  const handleLeave = () => {
    translateZ.set(0)
    px.set(0.5)
    py.set(0.5)
    glareOpacity.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
      whileHover={{ scale: scaleOnHover }}
      transition={{ scale: { type: 'spring', stiffness: 300, damping: 24 } }}
      style={{ perspective: 1200, ...style }}
      className={className.includes('perspective-hud') ? className : `perspective-hud ${className}`}
      {...rest}
    >
      <motion.div
        className="preserve-3d relative h-full w-full"
        style={{ rotateX, rotateY, translateZ }}
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              opacity: glareOpacity,
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.14), transparent 55%)`
              ),
            }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
