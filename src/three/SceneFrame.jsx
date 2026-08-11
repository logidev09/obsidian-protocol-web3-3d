import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

const perf = getPerfProfile()

/**
 * Pembungkus Canvas yang sadar-scroll.
 *
 * Tiga hal yang menjaga halaman tetap enak di-scroll:
 * 1. Canvas hanya me-render frame ketika section-nya terlihat (IntersectionObserver).
 * 2. `frameloop` berhenti total saat tab tidak aktif atau section keluar layar.
 * 3. `touch-action: pan-y` — di ponsel, swipe vertikal selalu men-scroll halaman,
 *    tidak pernah "tertelan" oleh kontrol 3D.
 */
export default function SceneFrame({ children, camera, className = '', dim = false }) {
  const host = useRef(null)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) setReady(true)
      },
      { rootMargin: '220px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={host} className={`scene ${dim ? 'scene--dim' : ''} ${className}`}>
      {ready && (
        <Canvas
          dpr={perf.dpr}
          frameloop={visible ? 'always' : 'never'}
          gl={{ antialias: !perf.low, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 7], fov: 42, ...camera }}
          style={{ touchAction: 'pan-y' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
