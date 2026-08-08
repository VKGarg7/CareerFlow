import { useId, useState } from 'react'

export default function FloatingField({
  label,
  icon,
  value,
  onChange,
  type = 'text',
  as = 'input',
  rows = 3,
  required = false,
  error,
  hint,
  className = '',
  ...rest
}) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const filled = value !== undefined && value !== null && String(value).length > 0
  const floated = focused || filled || type === 'date'
  const Comp = as === 'textarea' ? 'textarea' : 'input'

  return (
    <div className={className}>
      <div className={`field-glass ${focused ? 'is-focused' : ''} ${error ? 'has-error' : ''}`}>
        <div className="relative flex items-center">
          {icon && (
            <span className={`pointer-events-none absolute left-3.5 ${as === 'textarea' ? 'top-3.5' : 'top-1/2 -translate-y-1/2'} text-white/30`}>
              {icon}
            </span>
          )}
          <Comp
            id={id}
            type={as === 'input' ? type : undefined}
            rows={as === 'textarea' ? rows : undefined}
            value={value ?? ''}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`peer w-full bg-transparent text-sm text-white/90 outline-none placeholder-transparent ${
              as === 'textarea' ? 'resize-none px-4 pb-2.5 pt-5' : 'h-12 px-4'
            } ${icon ? 'pl-11' : ''}`}
            placeholder={label}
            {...rest}
          />
          <label
            htmlFor={id}
            className={`field-label-float ${icon ? '' : 'no-icon'} ${floated ? 'floated' : ''} ${as === 'textarea' && !floated ? 'top-5' : ''}`}
          >
            {label}{required && <span className="text-app-danger"> *</span>}
          </label>
        </div>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-app-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-white/30">{hint}</p>
      ) : null}
    </div>
  )
}
