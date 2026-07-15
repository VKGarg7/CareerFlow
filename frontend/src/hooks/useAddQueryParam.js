import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function useAddQueryParam(openAdd) {
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      openAdd()
      setSearchParams(p => { p.delete('add'); return p }, { replace: true })
    }
  }, [searchParams])
}
