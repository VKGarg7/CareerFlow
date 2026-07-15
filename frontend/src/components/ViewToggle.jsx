import { ViewList, GridView } from '@mui/icons-material'
export default function ViewToggle({ value, onChange }) {
  return (
    <div className="flex rounded-xl border border-white/[0.06] overflow-hidden bg-app-surface shrink-0">
      <button
        onClick={() => onChange('list')}
        title="List view"
        className={`px-3 py-2.5 transition ${
          value === 'list'
            ? 'bg-app-accent text-white'
            : 'text-white/35 hover:text-white/70 hover:bg-white/[0.05]'
        }`}
      >
        <ViewList fontSize="small" />
      </button>
      <button
        onClick={() => onChange('directory')}
        title="Directory view"
        className={`px-3 py-2.5 transition ${
          value === 'directory'
            ? 'bg-app-accent text-white'
            : 'text-white/35 hover:text-white/70 hover:bg-white/[0.05]'
        }`}
      >
        <GridView fontSize="small" />
      </button>
    </div>
  )
}
