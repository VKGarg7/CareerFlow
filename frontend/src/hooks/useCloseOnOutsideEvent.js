import { useEffect } from 'react'

/**
 * Closes an open dropdown/menu on outside click, Escape, or scroll of anything
 * other than the menu itself (so scrolling a long option list doesn't close it).
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {React.RefObject[]} refs - refs whose contents should NOT trigger a close (trigger button, menu panel)
 */
export default function useCloseOnOutsideEvent(open, onClose, refs) {
  useEffect(() => {
    if (!open) return
    const isInside = (target) => refs.some((ref) => ref.current?.contains(target))
    const onDocClick = (e) => { if (!isInside(e.target)) onClose() }
    const onEsc = (e) => { if (e.key === 'Escape') onClose() }
    const onScroll = (e) => { if (!isInside(e.target)) onClose() }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, onClose, refs])
}
