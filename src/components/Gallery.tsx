import type { ImageItem } from '../types'
import { ImageCard } from './ImageCard'

type Props = {
  images: ImageItem[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  nextBookmark: string | null
  onLoadMore: () => void
}

export function Gallery({ images, selectedIds, onToggle, nextBookmark, onLoadMore }: Props) {
  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            selected={selectedIds.has(image.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
      {nextBookmark && (
        <div className="flex justify-center py-6">
          <button
            onClick={onLoadMore}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </>
  )
}
