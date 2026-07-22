import { Email, LinkedIn } from '@mui/icons-material'
import { CardMenu } from './EntityCard'
import { initials } from '../utils/followup'

const contactBtnCls = 'flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] text-app-accent-soft hover:text-white hover:bg-app-accent transition'


export default function EntityListRow({
  onClick,
  accentBorder,  
  avatarColor,  
  name,
  subtitle,
  statusSlot,
  children,       
  email,
  linkedIn,
  menuItems,
}) {
  return (
    <div onClick={onClick}
      className={`group relative rounded-card border border-white/[0.06] border-l-4 ${accentBorder} bg-app-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover cursor-pointer overflow-x-auto no-scrollbar`}>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 px-4 sm:px-5 py-3.5 w-full sm:w-max sm:min-w-full">

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner-highlight ${avatarColor}`}>
        {initials(name)}
      </div>

      <div className="w-[calc(100%-3.25rem)] sm:w-44 min-w-0 shrink-0 order-1 sm:order-none">
        <p className="text-sm font-bold text-white/90 truncate">{name}</p>
        {subtitle && <p className="text-xs text-white/40 truncate mt-0.5">{subtitle}</p>}
      </div>

      <div className="w-full sm:w-36 max-w-full shrink-0" onClick={(e) => e.stopPropagation()}>
        {statusSlot}
      </div>

      {children}

      <div className="ml-auto flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {email && (
          <a href={`mailto:${email}`} title={email} className={contactBtnCls}>
            <Email sx={{ fontSize: 15 }} />
          </a>
        )}
        {linkedIn && (
          <a href={linkedIn} target="_blank" rel="noreferrer" title="LinkedIn" className={contactBtnCls}>
            <LinkedIn sx={{ fontSize: 15 }} />
          </a>
        )}
        <CardMenu items={menuItems} />
      </div>
      </div>
    </div>
  )
}
