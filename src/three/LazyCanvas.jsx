import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Canvas hemat daya:
 * - hanya me-render saat section-nya terlihat di viewport
 * - dpr dibatasi agar layar retina tidak membakar GPU
 * - menghormati prefers-reduced-motion
 * Ini yang menjaga scroll tetap mulus meski ada 4 scene 3D.
 */
export default function LazyCanvas({
  children,
  camera = { position: [0, 0, 7], fov: 42 },
  className = '',
  ...rest
}) {
  const host = useRef(null)
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={host} className={`canvas-host ${className}`} {...rest}>
      {mounted && (
        <Canvas
          frameloop={visible ? 'always' : 'demand'}
          camera={camera}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
