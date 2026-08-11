import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Canvas hanya dirender saat section-nya masuk viewport, dan frameloop
 * di-pause saat keluar — ini yang menjaga scroll tetap ringan meski ada
 * empat scene 3D di satu halaman.
 */
export default function Stage({ children, camera, className = '', dpr = [1, 1.75] }) {
  const host = useRef(null)
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const node = host.current
    if (!node) return

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: '220px 0px', threshold: 0.05 }
    )

    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={host} className={`stage ${className}`}>
      {mounted && (
        <Canvas
          dpr={dpr}
          frameloop={visible ? 'always' : 'demand'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 6], fov: 42, ...camera }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
