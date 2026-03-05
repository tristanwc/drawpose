import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { PinterestConnect } from './PinterestConnect'
import { BoardPicker } from './BoardPicker'
import type { ImageItem, PinterestBoard } from '../types'

type Props = {
  onLoad: (url: string) => void
  onSelectBoard: (boardId: string) => void
  isLoading: boolean
  error?: string
  authenticated: boolean
  onLogout: () => void
  boards: PinterestBoard[]
  boardsLoading: boolean
  boardsHasMore: boolean
  onLoadMoreBoards: () => void
  onAddImages: (images: ImageItem[]) => void
}

export function BoardInput({
  onLoad, onSelectBoard, isLoading, error,
  authenticated, onLogout,
  boards, boardsLoading, boardsHasMore, onLoadMoreBoards,
  onAddImages,
}: Props) {
  const [value, setValue] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) {
      onAddImages(
        files
          .filter(f => f.type.startsWith('image/'))
          .map(f => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), alt: f.name }))
      )
    }
    e.target.value = ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onLoad(trimmed)
  }

  return (
    <div className="px-4 pb-3 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <PinterestConnect authenticated={authenticated} onLogout={onLogout} />
        {authenticated && (
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            {showUrlInput ? 'Hide URL input' : 'or enter URL manually'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300
            hover:bg-gray-600 text-sm font-medium transition-colors"
        >
          <Upload size={14} />
          Upload Images
        </button>
        <span className="text-gray-500 text-xs">or Paste Files</span>
      </div>

      {authenticated && (
        <BoardPicker
          boards={boards}
          isLoading={boardsLoading}
          hasMore={boardsHasMore}
          onSelectBoard={onSelectBoard}
          onLoadMore={onLoadMoreBoards}
        />
      )}

      {authenticated && showUrlInput && (
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
      )}
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
