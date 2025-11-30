'use client'
import { useEffect, useState } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

export default function NumberBadge({
  value, suffix = '', prefix = '', decimals = 0, delay = 0, progress = 0,
}: { value:number; suffix?:string; prefix?:string; decimals?:number; delay?:number; progress?:number }) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    // Trigger animation when progress > 0.1 (as soon as section starts appearing)
    if (progress > 0.6 && !shouldAnimate) {
      setTimeout(() => setShouldAnimate(true), delay)
    }
  }, [progress, delay, shouldAnimate])

  const val = useCountUp(value, 1200, shouldAnimate)
  const text = val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return (
    <div className="space-y-2">
      <div className="font-extrabold leading-none"
           style={{ fontSize: 'clamp(2.5rem,6vw,5rem)' }}>
        {prefix}{text}
        <span style={{ color: 'var(--gold-300)' }}>{suffix}</span>
      </div>
    </div>
  )
}