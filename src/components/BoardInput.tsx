import { useState } from 'react'
import { Loader2 } from 'lucide-react'

type Props = {
  onLoad: (url: string) => void
  isLoading: boolean
  error?: string
}

export function BoardInput({ onLoad, isLoading, error }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onLoad(trimmed)
  }

  return (
    <div className="px-4 pb-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Pinterest board URL"
          className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
          Load
        </button>
      </form>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
