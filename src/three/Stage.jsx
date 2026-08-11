import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PALETTE, getPerfProfile } from './geo'

/**
 * Pembungkus <Canvas>:
 * - hanya di-mount saat mendekati viewport (hemat memori GPU),
 * - render loop dihentikan saat section keluar layar (scroll tetap ringan),
 * - touch-action pan-y supaya scroll di ponsel tidak tersandera canvas.
 */
export default function Stage({
  children,
  camera = { position: [0, 0, 7], fov: 42 },
  hint,
  className = ''
}) {
  const host = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const perf = useMemo(() => getPerfProfile(), [])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) setMounted(true)
      },
      { rootMargin: '240px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className={`stage ${className}`} ref={host}>
      {mounted && (
        <Canvas
          dpr={perf.dpr}
          frameloop={visible ? 'always' : 'demand'}
          camera={camera}
          style={{ touchAction: 'pan-y' }}
          gl={{
            antialias: !perf.low,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          onCreated={({ gl }) => gl.setClearColor(PALETTE.base, 0)}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      {hint && <span className="stage__hint">{hint}</span>}
    </div>
  )
}
