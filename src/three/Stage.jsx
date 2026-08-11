import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Pembungkus Canvas yang hemat: scene baru dipasang saat masuk viewport,
 * dan render dihentikan saat keluar viewport atau saat tab tidak aktif.
 * Ini yang menjaga scroll tetap halus meski ada empat scene 3D di satu halaman.
 */
export default function Stage({
  children,
  camera = { position: [0, 0, 6], fov: 42 },
  className = '',
  dpr = [1, 1.75],
  hint
}) {
  const host = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = host.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setActive(entry.isIntersecting)
      },
      { rootMargin: '250px 0px', threshold: 0.01 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div ref={host} className={`stage ${className}`}>
      {mounted && (
        <Canvas
          camera={camera}
          dpr={dpr}
          frameloop={active && visible ? 'always' : 'never'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      {hint && <span className="stage-hint">{hint}</span>}
    </div>
  )
}
