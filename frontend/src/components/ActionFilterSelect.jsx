import { actionOptions } from '../utils/auditLog'
import FilterSelect from './FilterSelect'

export default function ActionFilterSelect({ logs, value, onChange }) {
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      allLabel="All actions"
      className="w-48"
      options={actionOptions(logs).map((a) => ({ value: a, label: a.replaceAll('_', ' ') }))}
    />
  )
}
