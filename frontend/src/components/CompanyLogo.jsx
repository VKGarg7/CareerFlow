import { useState } from 'react'
import { initials, domainOf } from '../utils/followup'

export default function CompanyLogo({ name, website, dotColor, dotClassName, textClassName = 'text-sm', className = 'w-10 h-10' }) {
  const domain = domainOf(website)
  const [failed, setFailed] = useState(false)

  if (!domain || failed) {
    return (
      <div className={`${className} rounded-xl flex items-center justify-center text-white ${textClassName} font-bold shrink-0 shadow-inner-highlight ${dotClassName || ''}`}
        style={dotClassName ? undefined : { background: dotColor }}>
        {initials(name)}
      </div>
    )
  }

  return (
    <div className={`${className} rounded-xl flex items-center justify-center shrink-0 bg-app-raised shadow-inner-highlight overflow-hidden`}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=256`}
        alt=""
        className="w-2/3 h-2/3 object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
