import { X } from 'lucide-react'
import type { ImageItem } from '../types'

type Props = {
  image: ImageItem
  selected: boolean
  onToggle: (id: string) => void
  onRemove?: (id: string) => void
  masonry?: boolean
  onHoverStart?: () => void
  onHoverEnd?: () => void
}

export function ImageCard({ image, selected, onToggle, onRemove, masonry, onHoverStart, onHoverEnd }: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onToggle(image.id)
    }
  }

  return (
    <div
      className="relative cursor-pointer group"
      style={masonry ? undefined : { aspectRatio: '3/4' }}
      onClick={() => onToggle(image.id)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHoverStart?.()}
      onMouseLeave={() => onHoverEnd?.()}
      tabIndex={0}
      role="checkbox"
      aria-checked={selected}
      aria-label={image.alt}
    >
      <img
        src={image.url}
        alt={image.alt}
        className={masonry ? 'w-full h-auto rounded-lg' : 'w-full h-full object-cover rounded-lg'}
      />
      {/* Dim overlay when selected */}
      <div
        className={`absolute inset-0 rounded-lg transition-all duration-150 ${
          selected ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/10'
        }`}
      />
      {/* Selection ring */}
      {selected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-indigo-400 ring-offset-1 ring-offset-gray-900" />
      )}
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(image.id) }}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
          aria-label="Remove image"
        >
          <X size={14} />
        </button>
      )}
      {/* Checkbox */}
      <div className="absolute top-2 right-2">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            selected
              ? 'bg-indigo-500 border-indigo-500'
              : 'bg-black/40 border-white/60 group-hover:border-white'
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
