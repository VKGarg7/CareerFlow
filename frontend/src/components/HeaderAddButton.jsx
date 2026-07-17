import { Add } from '@mui/icons-material'

export default function HeaderAddButton({ label, onClick, drawerOpen = false }) {
  return (
    <button onClick={onClick} title={label}
      className={`flex items-center gap-2 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 hover:-translate-y-0.5 transition-all shadow-glow shadow-app-accent/40 ${drawerOpen ? 'p-2.5' : 'px-5 py-2.5'}`}>
      <Add fontSize="small" />{!drawerOpen && label}
    </button>
  )
}
