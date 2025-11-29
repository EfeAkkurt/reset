import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, durationMs = 1200, start = false) {
  const [val, setVal] = useState(0)
  const raf = useRef<number | null>(null)
  const startAt = useRef<number | null>(null)

  useEffect(() => {
    if (!start) return
    const step = (t: number) => {
      if (startAt.current == null) startAt.current = t
      const p = Math.min(1, (t - startAt.current) / durationMs)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased * 100) / 100)
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [start, target, durationMs])

  return val
}