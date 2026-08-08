export default function CursorSpotlight({ children, className = '', style, ...rest }) {
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div className={`cursor-spotlight-active relative ${className}`} style={style} onMouseMove={handleMove} {...rest}>
      <div className="cursor-spotlight" />
      {children}
    </div>
  )
}
