import { useState } from 'react'

/**
 * Shared state + handlers for the add/edit/delete modal trio used on entity list pages
 * (Companies, Applications, Recruiters, Referrals): open/edit/delete targets, plus
 * `handleSaved`/`handleDeleted` that flash a success message and refetch data.
 *
 * @param {string} entityLabel - e.g. "Company", "Application" — used in the default success messages
 * @param {(msg: string) => void} flash - success-message setter (e.g. from useTransientMessage)
 * @param {Array<() => void>} refetchFns - called after a save or delete
 * @param {object} [options]
 * @param {() => void} [options.onDeleted] - extra cleanup after delete (e.g. clearing a separate view target)
 */
export default function useCrudModals(entityLabel, flash, refetchFns, { onDeleted } = {}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (target) => { setEditTarget(target); setModalOpen(true) }
  const closeModal = () => setModalOpen(false)

  const refetchAll = () => refetchFns.forEach((fn) => fn())

  const handleSaved = () => {
    setModalOpen(false)
    flash(editTarget ? `${entityLabel} updated.` : `${entityLabel} added.`)
    refetchAll()
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    onDeleted?.()
    flash(`${entityLabel} removed.`)
    refetchAll()
  }

  return {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    openAdd, openEdit, closeModal, handleSaved, handleDeleted,
  }
}
