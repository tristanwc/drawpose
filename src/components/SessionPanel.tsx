import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import type { ImageItem, IntervalOption, SessionConfig } from '../types'

type Props = {
  config: SessionConfig
  selectedCount: number
  onChange: (config: SessionConfig) => void
  onStart: () => void
  onAddImages: (images: ImageItem[]) => void
}

const INTERVAL_OPTIONS: { value: IntervalOption; label: string }[] = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 180, label: '3m' },
  { value: 300, label: '5m' },
  { value: 'custom', label: 'Custom' },
]

export function SessionPanel({ config, selectedCount, onChange, onStart, onAddImages }: Props) {
  const [showCustomInput, setShowCustomInput] = useState(config.interval === 'custom')
  const [customRaw, setCustomRaw] = useState(String(config.customSeconds))
  const [customError, setCustomError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function filesToImageItems(files: File[]): ImageItem[] {
    return files
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), alt: f.name }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onAddImages(filesToImageItems(files))
    e.target.value = ''
  }

  function handleIntervalClick(value: IntervalOption) {
    setShowCustomInput(value === 'custom')
    setCustomError(null)
    onChange({ ...config, interval: value })
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setCustomRaw(raw)
    setCustomError(null)
    const n = Number(raw)
    if (raw !== '' && !isNaN(n) && n >= 1) {
      onChange({ ...config, customSeconds: n })
    }
  }

  function handleStart() {
    if (config.interval === 'custom' && !config.noTimer) {
      const n = Number(customRaw)
      if (customRaw === '' || isNaN(n) || n < 1) {
        setCustomError('Required — enter seconds (min 1)')
        return
      }
    }
    onStart()
  }

  return (
    <div className="fixed left-0 top-0 h-full w-44 z-40 bg-gray-900/95 backdrop-blur border-r border-gray-700 flex flex-col p-4 gap-3 pt-6">
      <span className="text-gray-400 text-xs uppercase tracking-wide">Interval</span>

      <div className="grid grid-cols-2 gap-1.5">
        {INTERVAL_OPTIONS.map(opt => (
          <button
            key={String(opt.value)}
            onClick={() => handleIntervalClick(opt.value)}
            disabled={config.noTimer}
            className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              config.noTimer
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : config.interval === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showCustomInput && !config.noTimer && (
        <div className="flex flex-col gap-1">
          <input
            type="number"
            min={1}
            max={3600}
            value={customRaw}
            onChange={handleCustomChange}
            className={`w-full px-2 py-1 rounded bg-gray-700 text-white text-sm border focus:outline-none ${
              customError ? 'border-red-500 focus:border-red-400' : 'border-gray-500 focus:border-indigo-400'
            }`}
            placeholder="seconds"
          />
          {customError && <span className="text-red-400 text-xs leading-tight">{customError}</span>}
        </div>
      )}

      <button
        onClick={() => onChange({ ...config, noTimer: !config.noTimer })}
        className={`w-full px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          config.noTimer
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        Toggle Timer
      </button>

      <hr className="border-gray-700 my-1" />

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
        Upload
      </button>
      <span className="text-gray-500 text-xs">or Paste Image(s)</span>

      <div className="mt-auto flex flex-col gap-2">
        <span className="text-gray-400 text-xs">
          {selectedCount} {selectedCount === 1 ? 'image' : 'images'} selected
        </span>
        <button
          onClick={handleStart}
          disabled={selectedCount === 0}
          className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm
            hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Start Session
        </button>
      </div>
    </div>
  )
}
