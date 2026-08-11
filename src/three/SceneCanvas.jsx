import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

/**
 * Wadah canvas hemat resource.
 *
 * - canvas baru dipasang saat section mendekati viewport
 * - render loop dibekukan saat section keluar layar (frameloop demand)
 * - devicePixelRatio dibatasi sesuai kemampuan perangkat
 *
 * Ini yang menjaga scroll tetap ringan walau ada empat scene 3D di satu halaman.
 */
export default function SceneCanvas({ children, camera, className = '', eventPrefix }) {
  const host = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const { dpr } = getPerfProfile()

  useEffect(() => {
    const el = host.current
    if (!el) return

    const warmup = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setMounted(true),
      { rootMargin: '400px 0px' }
    )
    const visibility = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.02 }
    )

    warmup.observe(el)
    visibility.observe(el)
    return () => {
      warmup.disconnect()
      visibility.disconnect()
    }
  }, [])

  return (
    <div ref={host} className={`canvas-host ${className}`}>
      {mounted && (
        <Canvas
          dpr={dpr}
          frameloop={active ? 'always' : 'never'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 7], fov: 42, ...camera }}
          eventPrefix={eventPrefix}
          style={{ touchAction: 'pan-y' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
