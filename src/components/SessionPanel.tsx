import { useState } from 'react'
import type { IntervalOption, SessionConfig } from '../types'

type Props = {
  config: SessionConfig
  selectedCount: number
  onChange: (config: SessionConfig) => void
  onStart: () => void
}

const INTERVAL_OPTIONS: { value: IntervalOption; label: string }[] = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 180, label: '3m' },
  { value: 300, label: '5m' },
  { value: 'custom', label: 'Custom' },
]

export function SessionPanel({ config, selectedCount, onChange, onStart }: Props) {
  const [showCustomInput, setShowCustomInput] = useState(config.interval === 'custom')
  const [customRaw, setCustomRaw] = useState(String(config.customSeconds))
  const [customError, setCustomError] = useState<string | null>(null)

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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur border-t border-gray-700 flex flex-col px-3 py-2 gap-2">
      {/* Row 1: interval controls */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-gray-400 text-xs uppercase tracking-wide shrink-0">Interval</span>
        <div className="flex gap-1.5 shrink-0">
          {INTERVAL_OPTIONS.map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => handleIntervalClick(opt.value)}
              disabled={config.noTimer}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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
          <input
            type="number"
            min={1}
            max={3600}
            value={customRaw}
            onChange={handleCustomChange}
            className={`w-16 shrink-0 px-2 py-1 rounded bg-gray-700 text-white text-xs border focus:outline-none ${
              customError ? 'border-red-500' : 'border-gray-500 focus:border-indigo-400'
            }`}
            placeholder="sec"
          />
        )}
        <button
          onClick={() => onChange({ ...config, noTimer: !config.noTimer })}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
            config.noTimer
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {config.noTimer ? 'Timer off' : 'No timer'}
        </button>
      </div>

      {/* Row 2: count + start */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-gray-400 text-xs">
          {customError
            ? <span className="text-red-400">{customError}</span>
            : <>{selectedCount} {selectedCount === 1 ? 'image' : 'images'} selected</>
          }
        </span>
        <button
          onClick={handleStart}
          disabled={selectedCount === 0}
          className="px-5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm
            hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          Start Session
        </button>
      </div>
    </div>
  )
}
