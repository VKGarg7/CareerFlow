/**
 * Derives active-filter count / isFiltered / clearAllFilters from a search string
 * and a list of [value, setter] filter pairs — the "Filters" chip bar shared by
 * Companies, Applications, and Recruiters list pages.
 *
 * @param {string} search
 * @param {(value: string) => void} setSearch
 * @param {Array<[string, (value: string) => void]>} filterPairs
 */
export default function useFilterState(search, setSearch, filterPairs) {
  const activeFilterCount = filterPairs.filter(([value]) => Boolean(value)).length
  const isFiltered = Boolean(search.trim()) || activeFilterCount > 0

  const clearAllFilters = () => {
    setSearch('')
    filterPairs.forEach(([, setValue]) => setValue(''))
  }

  return { activeFilterCount, isFiltered, clearAllFilters }
}
