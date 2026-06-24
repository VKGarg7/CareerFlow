import { ViewList, GridView } from '@mui/icons-material'

/**
 * Props:
 *   value: 'list' | 'directory'
 *   onChange: (mode) => void
 */
export default function ViewToggle({ value, onChange }) {
  return (
    <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shrink-0">
      <button
        onClick={() => onChange('list')}
        title="List view"
        className={`px-3 py-2.5 transition ${
          value === 'list'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
      >
        <ViewList fontSize="small" />
      </button>
      <button
        onClick={() => onChange('directory')}
        title="Directory view"
        className={`px-3 py-2.5 transition ${
          value === 'directory'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
      >
        <GridView fontSize="small" />
      </button>
    </div>
  )
}
