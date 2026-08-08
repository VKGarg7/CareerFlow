import { motion, useScroll, useTransform } from 'framer-motion'

export default function AmbientBackground() {
  const { scrollY } = useScroll()
  const parallaxSlow = useTransform(scrollY, [0, 800], [0, -40])
  const parallaxFast = useTransform(scrollY, [0, 800], [0, -90])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div style={{ y: parallaxSlow }} className="bg-parallax-slow absolute inset-0">
        <div className="absolute inset-0 bg-ambient-hero" />
        <div className="aurora-layer" />
      </motion.div>

      <motion.div style={{ y: parallaxSlow }} className="bg-parallax-slow absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[36rem] w-[36rem] animate-drift-slow rounded-full bg-app-accent/[0.10] blur-[150px]" />
        <div className="absolute -left-40 bottom-0 h-[32rem] w-[32rem] animate-drift rounded-full bg-app-emerald/[0.05] blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[24rem] w-[24rem] animate-drift rounded-full bg-app-purple/[0.07] blur-[140px]" />
        <div className="absolute left-1/3 top-2/3 h-[16rem] w-[16rem] animate-float rounded-full bg-app-cyan/[0.04] blur-[110px]" />
      </motion.div>

      <motion.div style={{ y: parallaxFast }} className="bg-parallax-slow absolute inset-0">
        <div className="star-field opacity-60" />
        <div className="light-rays opacity-50" />
      </motion.div>

      <div className="absolute inset-0 bg-grid-hud bg-grid-hud opacity-[0.35] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_10%,transparent_75%)]" />
      <div className="particle-field opacity-70" />
      <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay bg-noise" />
    </div>
  )
}
