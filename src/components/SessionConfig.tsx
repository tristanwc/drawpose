import { useRef } from 'react'
import { useState } from 'react'
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

export function SessionConfig({ config, selectedCount, onChange, onStart, onAddImages }: Props) {
  const [showCustomInput, setShowCustomInput] = useState(config.interval === 'custom')
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
    onChange({ ...config, interval: value })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700 px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Row 1: Interval pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-gray-400 text-sm mr-1 shrink-0">Interval:</span>
          {INTERVAL_OPTIONS.map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => handleIntervalClick(opt.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors shrink-0 ${
                config.interval === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {showCustomInput && (
            <input
              type="number"
              min={5}
              max={3600}
              value={config.customSeconds}
              onChange={e => onChange({ ...config, customSeconds: Math.max(5, Number(e.target.value)) })}
              className="w-20 px-2 py-1 rounded bg-gray-700 text-white text-sm border border-gray-500 focus:outline-none focus:border-indigo-400 shrink-0"
              placeholder="sec"
            />
          )}
        </div>

        {/* Row 2: Upload + selection count + Start */}
        <div className="flex items-center justify-between gap-3">
          <div>
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
              <Upload size={15} />
              Upload
            </button>
            <span className="text-gray-500 text-sm">or Paste Image(s)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">
              {selectedCount} {selectedCount === 1 ? 'image' : 'images'} selected
            </span>
            <button
              onClick={onStart}
              disabled={selectedCount === 0}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm
                hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
