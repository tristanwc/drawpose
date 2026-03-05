import { Loader2 } from 'lucide-react'
import type { PinterestBoard } from '../types'

type Props = {
  boards: PinterestBoard[]
  isLoading: boolean
  hasMore: boolean
  onSelectBoard: (boardId: string) => void
  onLoadMore: () => void
}

export function BoardPicker({ boards, isLoading, hasMore, onSelectBoard, onLoadMore }: Props) {
  if (isLoading && boards.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm px-4 py-3">
        <Loader2 size={14} className="animate-spin" />
        Loading boards...
      </div>
    )
  }

  if (boards.length === 0) {
    return <p className="text-gray-500 text-sm px-4 py-3">No boards found.</p>
  }

  return (
    <div className="px-4 pb-3">
      <p className="text-gray-400 text-xs mb-2">Your boards</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {boards.map(board => (
          <button
            key={board.id}
            onClick={() => onSelectBoard(board.id)}
            className="group bg-gray-800 hover:bg-gray-700 rounded-lg overflow-hidden text-left transition-colors"
          >
            {board.imageUrl ? (
              <img
                src={board.imageUrl}
                alt={board.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-700 flex items-center justify-center text-gray-500 text-xs">
                No cover
              </div>
            )}
            <div className="p-2">
              <p className="text-white text-sm font-medium truncate">{board.name}</p>
              <p className="text-gray-400 text-xs">{board.pinCount} pins</p>
            </div>
          </button>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-2 text-sm text-rose-400 hover:text-rose-300 disabled:opacity-50 flex items-center gap-1"
        >
          {isLoading && <Loader2 size={12} className="animate-spin" />}
          Load more boards
        </button>
      )}
    </div>
  )
}
