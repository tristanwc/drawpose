import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, Columns2 } from 'lucide-react'
import type { ImageItem } from '../types'
import { ImageCard } from './ImageCard'

type Props = {
  images: ImageItem[]
  selectedIds: Set<string>
  selectedCount: number
  totalCount: number
  onToggle: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  nextBookmark: string | null
  onLoadMore: () => void
}

export function Gallery({ images, selectedIds, selectedCount, totalCount, onToggle, onSelectAll, onDeselectAll, nextBookmark, onLoadMore }: Props) {
  const [layout, setLayout] = useState<'grid' | 'masonry'>('masonry')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleHoverStart(id: string) {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoveredId(id)
    hoverTimerRef.current = setTimeout(() => setPreviewVisible(true), 1000)
  }

  function handleHoverEnd() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setPreviewVisible(false)
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2 gap-4">
        <span className="text-gray-400 text-sm">{selectedCount} of {totalCount} selected</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectAll}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            Select all
          </button>
          <button
            onClick={onDeselectAll}
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            Deselect all
          </button>
          <button
            onClick={() => setLayout(l => l === 'grid' ? 'masonry' : 'grid')}
            title={layout === 'grid' ? 'Switch to masonry' : 'Switch to grid'}
            className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
          >
            {layout === 'grid' ? <Columns2 size={16} /> : <LayoutGrid size={16} />}
          </button>
        </div>
      </div>

      {layout === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
          {images.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              selected={selectedIds.has(image.id)}
              onToggle={onToggle}
              onHoverStart={() => handleHoverStart(image.id)}
              onHoverEnd={handleHoverEnd}
            />
          ))}
        </div>
      ) : (
        <div className="columns-2 sm:columns-4 lg:columns-5 gap-3 p-4">
          {images.map(image => (
            <div key={image.id} className="break-inside-avoid mb-3">
              <ImageCard
                image={image}
                selected={selectedIds.has(image.id)}
                onToggle={onToggle}
                masonry
              />
            </div>
          ))}
        </div>
      )}

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

      <AnimatePresence>
        {previewVisible && hoveredId && (() => {
          const img = images.find(i => i.id === hoveredId)
          return img ? (
            <motion.div
              key={hoveredId}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="max-w-[40vw] max-h-[70vh] rounded-xl shadow-2xl overflow-hidden bg-black ring-1 ring-white/10">
                <img
                  src={img.url}
                  alt={img.alt}
                  className="object-contain w-full h-full max-w-[40vw] max-h-[70vh]"
                />
              </div>
            </motion.div>
          ) : null
        })()}
      </AnimatePresence>
    </>
  )
}
