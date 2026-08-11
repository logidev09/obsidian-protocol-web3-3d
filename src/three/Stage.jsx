import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

/**
 * Wadah canvas hemat resource.
 * - Canvas baru di-mount ketika section mendekati viewport.
 * - Render loop dimatikan saat section keluar layar atau tab tidak aktif,
 *   sehingga scroll tetap ringan meski ada 4 scene di satu halaman.
 */
export default function Stage({
  children,
  camera = { position: [0, 0, 6], fov: 38 },
  className = '',
  onPointerMissed
}) {
  const holder = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [awake, setAwake] = useState(true)
  const perf = useRef(getPerfProfile()).current

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setVisible(entry.isIntersecting)
      },
      { rootMargin: '240px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onVis = () => setAwake(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div ref={holder} className={`stage ${className}`}>
      {mounted && (
        <Canvas
          dpr={perf.dpr}
          camera={camera}
          frameloop={visible && awake ? 'always' : 'never'}
          onPointerMissed={onPointerMissed}
          gl={{
            antialias: !perf.low,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
          }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
