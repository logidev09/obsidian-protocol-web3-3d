import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

/**
 * Pembungkus <Canvas> yang sadar viewport.
 * - Kanvas baru dipasang saat section mendekati layar (hemat memori GPU).
 * - Render loop mati saat section keluar layar, jadi scroll di bagian lain
 *   halaman tidak terbebani frame 3D yang tak terlihat.
 */
export default function SceneFrame({ children, camera, className = '', hint }) {
  const holder = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const { dpr } = getPerfProfile()

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setVisible(entry.isIntersecting)
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={holder} className={`scene ${className}`}>
      {mounted && (
        <Canvas
          dpr={dpr}
          frameloop={visible ? 'always' : 'never'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 7], fov: 42, ...camera }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      {hint && <span className="scene-hint">{hint}</span>}
    </div>
  )
}
