import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Lights from './Lights'
import Particles from './Particles'

/**
 * Wrapper canvas per-section.
 * - Hanya me-render saat section terlihat di viewport (IntersectionObserver + frameloop demand/always)
 * - dpr dibatasi supaya laptop tanpa GPU diskrit tetap 60fps
 * - Canvas tidak menangkap event scroll: touch-action pan-y
 */
export default function Scene({
  children,
  camera = { position: [0, 0, 6], fov: 42 },
  particles = true,
  particleColor = '#7c8cff',
  lightProps = {},
  className = ''
}) {
  const holder = useRef(null)
  const [active, setActive] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(m.matches)
    const fn = () => setReduced(m.matches)
    m.addEventListener?.('change', fn)
    return () => m.removeEventListener?.('change', fn)
  }, [])

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: '200px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={holder} className={`scene ${className}`}>
      {active && (
        <Canvas
          camera={camera}
          dpr={[1, 1.75]}
          frameloop={reduced ? 'demand' : 'always'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ touchAction: 'pan-y' }}
        >
          <Lights {...lightProps} />
          <Suspense fallback={null}>
            {children}
            {particles && <Particles color={particleColor} />}
          </Suspense>
        </Canvas>
      )}
      <div className="scene-hint" aria-hidden="true">
        <span className="dot" /> drag untuk memutar
      </div>
    </div>
  )
}
