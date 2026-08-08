import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion'

export default function CountUp({ value, duration = 1.1, format, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (v) => {
    const rounded = Math.round(v)
    return format ? format(rounded) : rounded.toLocaleString()
  })

  useEffect(() => {
    if (inView) motionVal.set(Number(value) || 0)
  }, [inView, value, motionVal])

  return <motion.span ref={ref} className={className}>{display}</motion.span>
}
