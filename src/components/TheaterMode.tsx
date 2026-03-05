import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SkipBack, SkipForward, Pause, Play, X, FlipHorizontal, Loader2 } from 'lucide-react'
import type { ImageItem, SessionConfig } from '../types'
import { useTimer } from '../hooks/useTimer'

type Props = {
  images: ImageItem[]
  config: SessionConfig
  onExit: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onNeedMore?: () => void
}

function getEffectiveDuration(config: SessionConfig): number {
  if (config.noTimer) return Number.MAX_SAFE_INTEGER
  return config.interval === 'custom' ? config.customSeconds : config.interval
}

export function TheaterMode({ images, config, onExit, hasMore = false, isLoadingMore = false, onNeedMore }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const duration = getEffectiveDuration(config)
  const prevLengthRef = useRef(images.length)

  function handleNext() {
    setIndex(i => {
      if (i === images.length - 1) {
        if (hasMore) {
          onNeedMore?.()
          // Stay at current image; new images arriving will advance via effect
          return i
        }
        setIsEnded(true)
        return i
      }
      return i + 1
    })
  }

  const { timeLeft, isPaused, pause, resume, reset } = useTimer(duration, handleNext)

  // Pause timer when ended
  useEffect(() => {
    if (isEnded) pause()
  }, [isEnded])

  // When at last image waiting for more, pause timer to avoid rapid re-triggers
  useEffect(() => {
    if (index === images.length - 1 && hasMore && !isEnded) {
      pause()
      onNeedMore?.()
    }
  }, [index, images.length, hasMore, isEnded])

  // Proactive prefetch when within 5 images of end
  useEffect(() => {
    if (hasMore && !isLoadingMore && images.length - index <= 5) {
      onNeedMore?.()
    }
  }, [index, hasMore, isLoadingMore, images.length])

  // When new images arrive and we were at the last one, advance
  useEffect(() => {
    const prev = prevLengthRef.current
    prevLengthRef.current = images.length
    if (images.length > prev && index === prev - 1) {
      setIndex(prev)
      reset(duration)
      setFlipped(false)
      setIsEnded(false)
    }
  }, [images.length])

  function goNext() {
    if (isEnded) return
    if (index === images.length - 1) {
      if (hasMore) {
        onNeedMore?.()
        return
      }
      setIsEnded(true)
      return
    }
    reset(duration)
    setFlipped(false)
    setIndex(i => i + 1)
  }

  function goBack() {
    if (isEnded) {
      reset(duration)
      setIsEnded(false)
    } else if (index > 0) {
      reset(duration)
      setFlipped(false)
      setIndex(i => i - 1)
    }
  }

  function toggleFlip() {
    setFlipped(f => !f)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          isPaused ? resume() : pause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          goNext()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFlip()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused, index, isEnded])

  const current = images[index]
  const progress = timeLeft / duration
  const atLastImage = index === images.length - 1
  const showLoadingMore = atLastImage && (hasMore || isLoadingMore) && !isEnded

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-medium">
        {index + 1} / {images.length}{hasMore ? '+' : ''}
      </div>

      {/* Keyboard shortcuts panel — right side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        {[
          { key: 'Space', label: isPaused ? 'Play' : 'Pause' },
          { key: '←', label: 'Previous' },
          { key: '→', label: 'Next' },
          { key: 'F', label: 'Flip' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 text-white/60 text-xs">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/80 text-xs leading-tight">{key}</kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Main image area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div style={{ transform: flipped ? 'scaleX(-1)' : 'none' }} className="h-full w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.img
              key={current.id}
              src={current.url}
              alt={current.alt}
              className="max-w-full max-h-full object-contain"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: isEnded ? 0.2 : 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>
        </div>

        {/* Session completed overlay */}
        <AnimatePresence>
          {isEnded && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-white text-4xl font-semibold tracking-wide drop-shadow-lg">
                Session Completed
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading more overlay */}
        <AnimatePresence>
          {showLoadingMore && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-black/60 text-white text-lg font-medium">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HUD bottom bar */}
      <div className="bg-black/70 backdrop-blur-sm px-6 py-4 flex items-center gap-6">
        {/* Progress bar + timer */}
        {!config.noTimer && (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-white font-mono text-sm w-10 text-right">{timeLeft}s</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            disabled={index === 0}
            className="p-3 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={isPaused ? resume : pause}
            className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={goNext}
            disabled={isEnded}
            className="p-3 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFlip}
            title="Flip horizontally (F)"
            className={`p-3 rounded-full transition-colors ${flipped ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'text-white hover:bg-white/10'}`}
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
