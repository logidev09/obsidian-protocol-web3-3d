import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Pembungkus <Canvas> yang dipakai semua scene.
 *
 * Tiga hal yang menjaga scroll tetap nyaman:
 * 1. frameloop="demand" -> canvas berhenti render saat keluar viewport.
 * 2. IntersectionObserver -> scene hanya mount saat terlihat.
 * 3. dpr dibatasi 1.6 -> GPU tidak jenuh di layar retina.
 */
export default function SceneCanvas({
  children,
  camera = { position: [0, 0, 6], fov: 42 },
  className = ''
}) {
  const holder = useRef()
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '200px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={holder} className={`scene ${className}`}>
      {visible && (
        <Canvas
          camera={camera}
          dpr={[1, 1.6]}
          frameloop={reduced ? 'demand' : 'always'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  )
}
