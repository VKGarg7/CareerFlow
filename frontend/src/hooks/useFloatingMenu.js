import { useEffect, useLayoutEffect, useState } from 'react'

/**
 * Positions a portal-rendered dropdown/menu relative to its trigger, flipping
 * upward when there isn't enough room below, and clamping horizontally to the viewport.
 *
 * @param {boolean} open
 * @param {React.RefObject} triggerRef
 * @param {object} [options]
 * @param {number|(rect: DOMRect) => number} [options.width] - fixed menu width, or a resolver (defaults to trigger width)
 * @param {'left'|'right'} [options.align='left'] - anchor the menu to the trigger's left or right edge
 * @param {number} [options.flipThreshold=160] - flip upward when space below is less than this
 * @param {number} [options.maxHeightCap] - caps pos.maxHeight; omit to skip maxHeight entirely
 * @param {number} [options.gap=6] - gap between trigger and menu
 * @param {number} [options.viewportPadding=8] - minimum distance from viewport edges
 * @returns {{ top?: number, bottom?: number, left: number, width?: number, maxHeight?: number } | null}
 */
export default function useFloatingMenu(open, triggerRef, {
  width,
  align = 'left',
  flipThreshold = 160,
  maxHeightCap,
  gap = 6,
  viewportPadding = 8,
} = {}) {
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = typeof width === 'function' ? width(rect) : width ?? rect.width

    const left = align === 'right'
      ? Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding)
      : Math.min(rect.left, window.innerWidth - menuWidth - viewportPadding)

    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap
    const spaceAbove = rect.top - viewportPadding - gap
    const openUp = spaceBelow < flipThreshold && spaceAbove > spaceBelow

    const next = {
      left: Math.max(viewportPadding, left),
      width: menuWidth,
    }
    if (openUp) next.bottom = window.innerHeight - rect.top + gap
    else next.top = rect.bottom + gap

    if (maxHeightCap !== undefined) {
      next.maxHeight = Math.min(maxHeightCap, Math.max(openUp ? spaceAbove : spaceBelow, 80))
    }

    setPos(next)
  }, [open, triggerRef, width, align, flipThreshold, maxHeightCap, gap, viewportPadding])

  useEffect(() => {
    if (!open) return
    const onResize = () => setPos(null)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open])

  return pos
}
