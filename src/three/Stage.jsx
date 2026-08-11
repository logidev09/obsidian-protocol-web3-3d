import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Pembungkus Canvas yang sadar viewport.
 * - Canvas baru dipasang saat section mendekati layar (hemat memori GPU).
 * - Render loop dimatikan saat section keluar layar → scroll tetap ringan.
 * - Menghormati prefers-reduced-motion dengan menurunkan dpr.
 */
export default function Stage({
  children,
  camera = { position: [0, 0, 6], fov: 45 },
  className = '',
  eventPrefix
}) {
  const holder = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = holder.current
    if (!el) return

    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true)
          preload.disconnect()
        }
      },
      { rootMargin: '300px 0px' }
    )

    const activity = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.02 }
    )

    preload.observe(el)
    activity.observe(el)
    return () => {
      preload.disconnect()
      activity.disconnect()
    }
  }, [])

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <div ref={holder} className={`stage ${className}`}>
      {mounted && (
        <Canvas
          frameloop={active ? 'always' : 'never'}
          dpr={reduced ? 1 : [1, 1.75]}
          camera={camera}
          eventPrefix={eventPrefix}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ touchAction: 'pan-y' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
