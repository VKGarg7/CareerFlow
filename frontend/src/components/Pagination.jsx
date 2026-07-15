import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material'

export default function Pagination({ page, totalPages, totalElements, size, onPageChange }) {
  if (totalPages <= 1) return null

  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, totalElements)

  return (
    <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
      <p className="text-xs text-white/35">
        Showing {from}–{to} of {totalElements}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Previous page"
        >
          <KeyboardArrowLeft fontSize="small" />
        </button>
        <span className="px-3 text-xs font-medium text-white/50 whitespace-nowrap">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next page"
        >
          <KeyboardArrowRight fontSize="small" />
        </button>
      </div>
    </div>
  )
}
