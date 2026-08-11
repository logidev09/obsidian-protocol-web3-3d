import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

/**
 * Canvas yang hemat: baru dipasang saat mendekati viewport, dan
 * render-loop-nya berhenti total saat section keluar layar.
 * Ini yang menjaga scroll tetap ringan walau ada 4 scene 3D.
 *
 * touchAction: 'pan-y' → di layar sentuh, swipe vertikal tetap men-scroll
 * halaman, bukan tertahan canvas.
 */
export default function LazyCanvas({ children, camera, className = '' }) {
  const holder = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const [dpr] = useState(() => getPerfProfile().dpr)

  useEffect(() => {
    const el = holder.current
    if (!el) return

    const mountObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true)
          mountObserver.disconnect()
        }
      },
      { rootMargin: '400px 0px' }
    )

    const activeObserver = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.05 }
    )

    mountObserver.observe(el)
    activeObserver.observe(el)

    const onVisibility = () => {
      if (document.hidden) setActive(false)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mountObserver.disconnect()
      activeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div ref={holder} className={`canvas-holder ${className}`}>
      {mounted && (
        <Canvas
          dpr={dpr}
          frameloop={active ? 'always' : 'never'}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
          camera={camera || { position: [0, 0, 7], fov: 42 }}
          style={{ touchAction: 'pan-y' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
