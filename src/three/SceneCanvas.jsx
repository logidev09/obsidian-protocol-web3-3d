import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

/**
 * Wadah <Canvas> hemat daya.
 * - baru dipasang saat section mendekati viewport
 * - render loop berhenti total ketika section keluar layar
 * - touch-action: pan-y -> scroll jari tetap normal di atas canvas
 */
export default function SceneCanvas({ children, camera, className = '' }) {
  const holder = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const profile = useRef(getPerfProfile())

  useEffect(() => {
    const el = holder.current
    if (!el) return

    const preload = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setMounted(true),
      { rootMargin: '600px 0px' }
    )
    const active = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.01
    })

    preload.observe(el)
    active.observe(el)
    return () => {
      preload.disconnect()
      active.disconnect()
    }
  }, [])

  return (
    <div ref={holder} className={`canvas-holder ${className}`}>
      {mounted && (
        <Canvas
          dpr={profile.current.dpr}
          frameloop={visible ? 'always' : 'never'}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
          camera={{ position: [0, 0, 7], fov: 42, ...camera }}
          style={{ touchAction: 'pan-y' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      <div className="canvas-hint" aria-hidden="true">
        <span className="dot" /> drag to rotate
      </div>
    </div>
  )
}
