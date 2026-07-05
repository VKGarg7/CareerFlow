const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
  </svg>
)

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
  </svg>
)

/** Preset icon/tone shorthands so callers can pass `icon: 'edit'` instead of importing svgs. */
const PRESET_ICONS = { edit: <EditIcon />, delete: <DeleteIcon /> }

const TONE_CLASSES = {
  default: 'border-gray-200 text-gray-600 bg-white hover:bg-gray-700 hover:text-white hover:border-gray-700',
  danger:  'border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500',
  accent:  'border-amber-200 text-amber-600 bg-white hover:bg-amber-500 hover:text-white hover:border-amber-500',
  info:    'border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white hover:border-blue-600',
}

/**
 * Shared list-row card shell used by Companies/Applications/Recruiters/Referrals.
 * Each page supplies its own status accent, avatar, title/chip content, and
 * action buttons — this component only owns the outer layout.
 */
export function EntityCard({ onClick, accentColor, avatarColor, avatarText, titleSlot, chips, note, actions = [], actionsSlot }) {
  const trimmedNote = note?.trim()
  return (
    <div onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${accentColor} p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}>
      <div className="flex flex-wrap sm:flex-nowrap items-start gap-4">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor}`}>
          {avatarText}
        </div>

        <div className="flex-1 min-w-[12rem] sm:min-w-0">
          <div className="min-w-0 mb-2">{titleSlot}</div>
          {chips && <div className="flex flex-wrap gap-2 mb-1.5">{chips}</div>}
          {trimmedNote && <p className="text-xs text-gray-400 line-clamp-1 italic">"{trimmedNote}"</p>}
        </div>

        {actionsSlot ? (
          <div className="w-full sm:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>{actionsSlot}</div>
        ) : actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions.map(({ key, label, icon, onClick: onAction, tone = 'default', className = '' }) => (
              <button key={key || label} onClick={onAction} title={typeof label === 'string' ? label : key}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${TONE_CLASSES[tone]} ${className}`}>
                {typeof icon === 'string' ? PRESET_ICONS[icon] : icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Shared grid/directory card shell (compact card for grid view).
 * `revealActionsOnHover` preserves Referrals' hover-reveal footer; other
 * pages keep their always-visible footer (the default).
 */
export function EntityDirectoryCard({
  onClick, borderTopColor, statusBarColor, avatarColor, avatarText, titleSlot, chips, note, actions = [],
  revealActionsOnHover = false,
}) {
  const trimmedNote = note?.trim()
  return (
    <div onClick={onClick} style={borderTopColor ? { borderTopColor } : undefined}
      className={`group bg-white rounded-2xl border border-gray-100 ${statusBarColor ? '' : 'border-t-4'} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer overflow-hidden relative`}>
      {statusBarColor && <div className={`h-1 w-full ${statusBarColor}`} />}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor}`}>
            {avatarText}
          </div>
          <div className="flex-1 min-w-0">{titleSlot}</div>
        </div>

        {chips && <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>{chips}</div>}
        {trimmedNote && <p className="text-[11px] text-gray-400 line-clamp-2 italic">"{trimmedNote}"</p>}
      </div>

      {actions.length > 0 && (
        <div
          className={`flex border-t border-gray-100 bg-white ${revealActionsOnHover
            ? 'absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150'
            : ''}`}
          onClick={(e) => e.stopPropagation()}>
          {actions.map(({ key, label, icon, onClick: onAction, tone = 'default' }, i) => (
            <div key={key || label} className="flex-1 flex items-center">
              {i > 0 && <div className="w-px self-stretch bg-gray-100" />}
              <button onClick={onAction}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
                  tone === 'danger' ? 'text-red-400 hover:bg-red-50' :
                  tone === 'accent' ? 'text-amber-600 hover:bg-amber-50' :
                  tone === 'info' ? 'text-blue-600 hover:bg-blue-50' :
                  'text-gray-600 hover:bg-gray-50'
                }`}>
                {icon}
                {label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
