'use client'
import { useEffect, useRef, useState } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

export default function NumberBadge({
  value, suffix = '', prefix = '', decimals = 0, delay = 0,
}: { value:number; suffix?:string; prefix?:string; decimals?:number; delay?:number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setInView(true), delay); io.disconnect() }
    }, { threshold: 0.3 })
    io.observe(el); return () => io.disconnect()
  }, [delay])

  const val = useCountUp(value, 1200, inView)
  const text = val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return (
    <div ref={ref} className="space-y-2">
      <div className="font-extrabold leading-none"
           style={{ fontSize: 'clamp(2.5rem,6vw,5rem)' }}>
        {prefix}{text}
        <span style={{ color: 'var(--gold-300)' }}>{suffix}</span>
      </div>
    </div>
  )
}