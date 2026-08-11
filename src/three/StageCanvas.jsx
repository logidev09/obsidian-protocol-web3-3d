import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PALETTE } from './geo'

/**
 * Wrapper canvas hemat resource:
 * - render dijeda saat section keluar dari viewport (IntersectionObserver)
 * - `frameloop="demand"` tidak dipakai karena scene animatif, tapi DPR dibatasi
 * - menghormati prefers-reduced-motion
 */
export default function StageCanvas({
  children,
  camera = { position: [0, 0, 7], fov: 42 },
  className = ''
}) {
  const holder = useRef()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = holder.current
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '200px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={holder} className={`stage ${className}`}>
      {visible && (
        <Canvas
          camera={camera}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearColor(PALETTE.void, 0)}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      <div className="stage-hint" aria-hidden="true">
        <span className="dot" /> drag untuk memutar
      </div>
    </div>
  )
}
