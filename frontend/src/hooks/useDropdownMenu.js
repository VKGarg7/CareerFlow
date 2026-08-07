import { useRef, useState } from 'react'
import useFloatingMenu from './useFloatingMenu'
import useCloseOnOutsideEvent from './useCloseOnOutsideEvent'

/**
 * Bundles the open-state + refs + positioning + outside-close wiring shared by every
 * portal-rendered dropdown (FilterSelect, Pagination's PageSizeSelect, ResearchNoteSearch).
 * Callers still render their own trigger/panel markup — this just centralizes the plumbing.
 *
 * @param {object} [floatingMenuOptions] - forwarded to useFloatingMenu (width, align, flipThreshold, maxHeightCap, gap, viewportPadding)
 */
export default function useDropdownMenu(floatingMenuOptions) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const pos = useFloatingMenu(open, triggerRef, floatingMenuOptions)
  useCloseOnOutsideEvent(open, () => setOpen(false), [triggerRef, menuRef])

  return { open, setOpen, triggerRef, menuRef, pos }
}
