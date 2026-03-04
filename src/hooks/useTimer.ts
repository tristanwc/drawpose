import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(duration: number, onComplete: () => void) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isPaused, setIsPaused] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setTimeLeft(duration)
    setIsPaused(false)
  }, [duration])

  useEffect(() => {
    if (isPaused) return
    if (timeLeft <= 0) {
      onCompleteRef.current()
      return
    }
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isPaused, timeLeft])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])
  const reset = useCallback((newDuration: number) => {
    setTimeLeft(newDuration)
    setIsPaused(false)
  }, [])

  return { timeLeft, isPaused, pause, resume, reset }
}
