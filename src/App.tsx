import { useEffect, useState } from 'react'
import { Gallery } from './components/Gallery'
import { SessionConfig } from './components/SessionConfig'
import { TheaterMode } from './components/TheaterMode'
import { BoardInput } from './components/BoardInput'
import type { AppMode, ImageItem, SessionConfig as SessionConfigType } from './types'
import './App.css'

function App() {
  const [mode, setMode] = useState<AppMode>('gallery')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [config, setConfig] = useState<SessionConfigType>({ interval: 30, customSeconds: 30 })
  const [images, setImages] = useState<ImageItem[]>([])
  const [nextBookmark, setNextBookmark] = useState<string | null>(null)
  const [boardLoading, setBoardLoading] = useState(false)
  const [boardError, setBoardError] = useState<string | undefined>()
  const [boardUrl, setBoardUrl] = useState('')

  const selectedImages = images.filter(img => selectedIds.has(img.id))

  function addImages(newImages: ImageItem[]) {
    if (!newImages.length) return
    setImages(prev => [...prev, ...newImages])
    setSelectedIds(prev => {
      const next = new Set(prev)
      newImages.forEach(img => next.add(img.id))
      return next
    })
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
  }, [])

  function selectAll() {
    setSelectedIds(new Set(images.map(img => img.id)))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  function toggleImage(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function loadBoard(url: string) {
    setBoardLoading(true)
    setBoardError(undefined)
    setBoardUrl(url)
    try {
      const res = await fetch(`/api/board?url=${encodeURIComponent(url)}`)
      const data = await res.json() as { images?: ImageItem[]; nextBookmark?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load board')
      setImages(data.images ?? [])
      setNextBookmark(data.nextBookmark ?? null)
      setSelectedIds(new Set())
    } catch (err) {
      setBoardError(err instanceof Error ? err.message : 'Failed to load board')
    } finally {
      setBoardLoading(false)
    }
  }

  async function loadMore() {
    if (!nextBookmark || !boardUrl) return
    try {
      const res = await fetch(
        `/api/board?url=${encodeURIComponent(boardUrl)}&bookmark=${encodeURIComponent(nextBookmark)}`
      )
      const data = await res.json() as { images?: ImageItem[]; nextBookmark?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load more')
      setImages(prev => [...prev, ...(data.images ?? [])])
      setNextBookmark(data.nextBookmark ?? null)
    } catch (err) {
      setBoardError(err instanceof Error ? err.message : 'Failed to load more')
    }
  }

  if (mode === 'session') {
    return (
      <TheaterMode
        images={selectedImages}
        config={config}
        onExit={() => setMode('gallery')}
      />
    )
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">DrawPose</h1>
        <p className="text-gray-400 text-sm mt-1">Select images to include in your drawing session</p>
      </div>
      <BoardInput onLoad={loadBoard} isLoading={boardLoading} error={boardError} />
      <Gallery
        images={images}
        selectedIds={selectedIds}
        selectedCount={selectedIds.size}
        totalCount={images.length}
        onToggle={toggleImage}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        nextBookmark={nextBookmark}
        onLoadMore={loadMore}
      />
      <SessionConfig
        config={config}
        selectedCount={selectedIds.size}
        onChange={setConfig}
        onStart={() => setMode('session')}
        onAddImages={addImages}
      />
    </div>
  )
}

export default App
