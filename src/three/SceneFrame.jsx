import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PALETTE } from './geo'

/**
 * Pembungkus canvas yang ramah scroll & baterai:
 * - Render dijeda saat section keluar dari viewport (IntersectionObserver)
 * - dpr dibatasi 1–1.6 supaya tidak berat di layar retina
 * - Hormati prefers-reduced-motion → frameloop 'demand'
 * - Canvas tidak pernah menangkap wheel → scroll halaman selalu lancar
 */
export default function SceneFrame({
  children,
  camera = { position: [0, 0, 6], fov: 45 },
  className = '',
  eager = false
}) {
  const host = useRef(null)
  const [visible, setVisible] = useState(eager)
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
      { rootMargin: '200px 0px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={host} className={`scene ${className}`}>
      <Canvas
        camera={camera}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reduced ? 'demand' : visible ? 'always' : 'never'}
        onCreated={({ scene }) => {
          scene.fog = null
        }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={[PALETTE.void]} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
      <div className="scene-hint" aria-hidden="true">
        <span className="dot" /> drag to rotate
      </div>
    </div>
  )
}
