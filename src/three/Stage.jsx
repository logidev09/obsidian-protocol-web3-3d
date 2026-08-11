import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Pembungkus <Canvas> yang sadar-performa:
 * - hanya me-mount WebGL saat section masuk viewport (IntersectionObserver)
 * - frameloop otomatis berhenti saat section keluar layar
 * - dpr dibatasi supaya tidak berat di layar retina
 * - fallback statis kalau perangkat/preferensi tidak mendukung
 */
export default function Stage({ children, className = '', camera, dpr = [1, 1.75] }) {
  const host = useRef(null)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '220px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={host} className={`stage ${className}`}>
      {visible ? (
        <Canvas
          dpr={dpr}
          frameloop={reduced ? 'demand' : 'always'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 6], fov: 45, ...camera }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      ) : (
        <div className="stage-placeholder" aria-hidden="true" />
      )}
    </div>
  )
}
