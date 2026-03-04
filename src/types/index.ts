export type ImageItem = {
  id: string
  url: string
  alt: string
}

export type IntervalOption = 15 | 30 | 60 | 180 | 300 | 'custom'

export type SessionConfig = {
  interval: IntervalOption
  customSeconds: number
  noTimer: boolean
}

export type AppMode = 'gallery' | 'session'

export type BoardState = 'idle' | 'loading' | 'error'
