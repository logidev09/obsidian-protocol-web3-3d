import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Wrapper canvas hemat performa:
 * - render hanya saat section terlihat di viewport (IntersectionObserver)
 * - dpr dibatasi, antialias mati di layar padat
 * - frameloop "demand"-friendly: pause total saat off-screen
 */
export default function SceneFrame({ children, camera = { position: [0, 0, 6], fov: 38 }, className = '' }) {
  const wrap = useRef(null)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(m.matches)
    const fn = () => setReduced(m.matches)
    m.addEventListener?.('change', fn)
    return () => m.removeEventListener?.('change', fn)
  }, [])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '160px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} className={`scene ${className}`}>
      {visible && (
        <Canvas
          dpr={[1, 1.7]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={camera}
          frameloop={reduced ? 'demand' : 'always'}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      {!visible && <div className="scene-skeleton" aria-hidden="true" />}
    </div>
  )
}
