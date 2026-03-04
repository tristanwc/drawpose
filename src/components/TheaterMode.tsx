import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SkipBack, SkipForward, Pause, Play, X } from 'lucide-react'
import type { ImageItem, SessionConfig } from '../types'
import { useTimer } from '../hooks/useTimer'

type Props = {
  images: ImageItem[]
  config: SessionConfig
  onExit: () => void
}

function getEffectiveDuration(config: SessionConfig): number {
  return config.interval === 'custom' ? config.customSeconds : config.interval
}

export function TheaterMode({ images, config, onExit }: Props) {
  const [index, setIndex] = useState(0)
  const duration = getEffectiveDuration(config)

  function handleNext() {
    setIndex(i => (i + 1) % images.length)
  }

  const { timeLeft, isPaused, pause, resume, reset } = useTimer(duration, handleNext)

  function goNext() {
    reset(duration)
    setIndex(i => (i + 1) % images.length)
  }

  function goBack() {
    if (index > 0) {
      reset(duration)
      setIndex(i => i - 1)
    }
  }

  const current = images[index]
  const progress = timeLeft / duration

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-medium">
        {index + 1} / {images.length}
      </div>

      {/* Main image area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={current.id}
            src={current.url}
            alt={current.alt}
            className="max-w-full max-h-full object-contain"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
      </div>

      {/* HUD bottom bar */}
      <div className="bg-black/70 backdrop-blur-sm px-6 py-4 flex items-center gap-6">
        {/* Progress bar + timer */}
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

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            disabled={index === 0}
            className="p-2 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={isPaused ? resume : pause}
            className="p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={goNext}
            className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
