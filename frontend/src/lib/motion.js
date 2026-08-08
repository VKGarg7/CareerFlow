export const easeOut = [0.16, 1, 0.3, 1]

export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.7, ease: easeOut },
}

export const cardEntrance = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: easeOut } },
}

export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
}

export const springLift = { type: 'spring', stiffness: 340, damping: 26 }
export const springSnappy = { type: 'spring', stiffness: 420, damping: 34 }

export const hoverLift = { y: -3, transition: springLift }
export const tapPress = { scale: 0.97, transition: { duration: 0.12 } }

export const modalZoomFromCursor = (originX = '50%', originY = '50%') => ({
  initial: { opacity: 0, scale: 0.85, transformOrigin: `${originX} ${originY}` },
  animate: { opacity: 1, scale: 1, transformOrigin: `${originX} ${originY}` },
  exit: { opacity: 0, scale: 0.9, transformOrigin: `${originX} ${originY}` },
  transition: { type: 'spring', stiffness: 380, damping: 32 },
})

export const drawerSlideBlur = {
  initial: { x: '100%', opacity: 0.4, filter: 'blur(8px)' },
  animate: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: { x: '100%', opacity: 0.4, filter: 'blur(8px)' },
  transition: { type: 'spring', stiffness: 320, damping: 34 },
}
