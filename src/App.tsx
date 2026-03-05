import { useCallback, useEffect, useState } from 'react'
import { Gallery } from './components/Gallery'
import { SessionPanel } from './components/SessionPanel'
import { TheaterMode } from './components/TheaterMode'
import { BoardInput } from './components/BoardInput'
import type { AppMode, ImageItem, PinterestBoard, SessionConfig as SessionConfigType } from './types'
import { apiUrl } from './lib/api'
import './App.css'

function App() {
  const [mode, setMode] = useState<AppMode>('gallery')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [config, setConfig] = useState<SessionConfigType>({ interval: 30, customSeconds: 30, noTimer: false })
  const [images, setImages] = useState<ImageItem[]>([])
  const [boardLoading, setBoardLoading] = useState(false)
  const [boardError, setBoardError] = useState<string | undefined>()
  const [currentBoardUrl, setCurrentBoardUrl] = useState<string | null>(null)
  const [boardId, setBoardId] = useState<string | null>(null)
  const [nextBookmark, setNextBookmark] = useState<string | null>(null)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [boards, setBoards] = useState<PinterestBoard[]>([])
  const [boardsLoading, setBoardsLoading] = useState(false)
  const [boardsNextBookmark, setBoardsNextBookmark] = useState<string | null>(null)

  const selectedImages = images.filter(img => selectedIds.has(img.id))

  const addImages = useCallback((newImages: ImageItem[]) => {
    if (!newImages.length) return
    setImages(prev => [...prev, ...newImages])
    setSelectedIds(prev => {
      const next = new Set(prev)
      newImages.forEach(img => next.add(img.id))
      return next
    })
  }, [])

  // Check auth status on mount and after OAuth redirect
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(apiUrl('/auth/status'))
        const data = await res.json() as { authenticated: boolean }
        setIsAuthenticated(data.authenticated)
        if (data.authenticated) fetchBoards()
      } catch { /* server not running */ }
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', window.location.pathname)
    }
    checkAuth()
  }, [])

  async function fetchBoards(bookmark?: string) {
    setBoardsLoading(true)
    try {
      const params = bookmark ? `?bookmark=${encodeURIComponent(bookmark)}` : ''
      const res = await fetch(apiUrl(`/boards${params}`))
      const data = await res.json() as { boards?: PinterestBoard[]; nextBookmark?: string }
      if (bookmark) {
        setBoards(prev => [...prev, ...(data.boards ?? [])])
      } else {
        setBoards(data.boards ?? [])
      }
      setBoardsNextBookmark(data.nextBookmark ?? null)
    } catch (err) {
      console.error('Failed to fetch boards:', err)
    } finally {
      setBoardsLoading(false)
    }
  }

  async function handleLogout() {
    await fetch(apiUrl('/auth/logout'), { method: 'POST' })
    setIsAuthenticated(false)
    setBoards([])
    setBoardsNextBookmark(null)
  }

  async function loadBoardById(id: string) {
    setBoardLoading(true)
    setBoardError(undefined)
    try {
      const res = await fetch(apiUrl(`/board?boardId=${encodeURIComponent(id)}`))
      const data = await res.json() as { images?: ImageItem[]; error?: string; nextBookmark?: string; boardId?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load board')
      const newImages = data.images ?? []
      setImages(newImages)
      setSelectedIds(new Set(newImages.map(img => img.id)))
      setBoardId(data.boardId ?? id)
      setNextBookmark(data.nextBookmark ?? null)
      setCurrentBoardUrl(null)
    } catch (err) {
      setBoardError(err instanceof Error ? err.message : 'Failed to load board')
    } finally {
      setBoardLoading(false)
    }
  }

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageFiles = items
        .filter(item => item.type.startsWith('image/'))
        .map(item => item.getAsFile())
        .filter((f): f is File => f !== null)
      if (imageFiles.length) {
        addImages(imageFiles.map(f => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), alt: 'pasted image' })))
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [addImages])

  function selectAll() {
    setSelectedIds(new Set(images.map(img => img.id)))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  function removeImage(id: string) {
    setImages(prev => prev.filter(img => img.id !== id))
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function removeSelected() {
    setImages(prev => prev.filter(img => !selectedIds.has(img.id)))
    setSelectedIds(new Set())
  }

  function toggleImage(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function clearImages() {
    setImages([])
    setSelectedIds(new Set())
    setBoardError(undefined)
  }

  async function loadBoard(url: string) {
    setBoardLoading(true)
    setBoardError(undefined)
    try {
      const res = await fetch(apiUrl(`/board?url=${encodeURIComponent(url)}`))
      const data = await res.json() as { images?: ImageItem[]; error?: string; nextBookmark?: string; boardId?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load board')
      const newImages = data.images ?? []
      setImages(newImages)
      setSelectedIds(new Set(newImages.map(img => img.id)))
      setCurrentBoardUrl(url)
      setBoardId(data.boardId ?? null)
      setNextBookmark(data.nextBookmark ?? null)
    } catch (err) {
      setBoardError(err instanceof Error ? err.message : 'Failed to load board')
    } finally {
      setBoardLoading(false)
    }
  }

  async function loadMoreImages() {
    if (!nextBookmark || !boardId || isFetchingMore) return
    setIsFetchingMore(true)
    try {
      const params = new URLSearchParams({ boardId, bookmark: nextBookmark })
      if (currentBoardUrl) params.set('url', currentBoardUrl)
      const res = await fetch(apiUrl(`/board?${params}`))
      const data = await res.json() as { images?: ImageItem[]; error?: string; nextBookmark?: string; boardId?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load more')
      addImages(data.images ?? [])
      setNextBookmark(data.nextBookmark ?? null)
    } catch (err) {
      console.error('Failed to load more images:', err)
    } finally {
      setIsFetchingMore(false)
    }
  }

  if (mode === 'session') {
    return (
      <TheaterMode
        images={selectedImages}
        config={config}
        onExit={() => setMode('gallery')}
        hasMore={!!nextBookmark}
        isLoadingMore={isFetchingMore}
        onNeedMore={loadMoreImages}
      />
    )
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">DrawPose</h1>
        <p className="text-gray-400 text-sm mt-1">Select images to include in your drawing session</p>
      </div>
      <BoardInput
        onLoad={loadBoard}
        onSelectBoard={loadBoardById}
        isLoading={boardLoading}
        error={boardError}
        authenticated={isAuthenticated}
        onLogout={handleLogout}
        boards={boards}
        boardsLoading={boardsLoading}
        boardsHasMore={!!boardsNextBookmark}
        onLoadMoreBoards={() => { if (boardsNextBookmark) fetchBoards(boardsNextBookmark) }}
        onAddImages={addImages}
      />
      <Gallery
        images={images}
        selectedIds={selectedIds}
        selectedCount={selectedIds.size}
        totalCount={images.length}
        boardKey={boardId ?? 'none'}
        onToggle={toggleImage}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onRemove={removeImage}
        onRemoveSelected={removeSelected}
        onClear={clearImages}
      />
      <SessionPanel
        config={config}
        selectedCount={selectedIds.size}
        onChange={setConfig}
        onStart={() => setMode('session')}
      />
    </div>
  )
}

export default App
