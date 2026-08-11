import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

/**
 * Pembungkus <Canvas>.
 *
 * Dua hal yang menjaga scroll tetap nyaman:
 * 1. canvas baru dipasang saat section-nya mendekati viewport (IntersectionObserver);
 * 2. frameloop dimatikan begitu section keluar layar, jadi GPU tidak bekerja
 *    untuk sesuatu yang tidak terlihat.
 */
export default function SceneFrame({ children, camera, className = '', label }) {
  const host = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const { dpr } = getPerfProfile()

  useEffect(() => {
    const el = host.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setVisible(entry.isIntersecting)
      },
      { rootMargin: '200px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={host} className={`scene-frame ${className}`} aria-label={label} role="img">
      {mounted && (
        <Canvas
          dpr={dpr}
          frameloop={visible ? 'always' : 'never'}
          camera={{ position: [0, 0, 7], fov: 42, ...camera }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      <span className="scene-frame__hint">drag · hover</span>
    </div>
  )
}
