import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Wrapper Canvas hemat sumber daya:
 * - hanya me-render saat section terlihat di viewport (IntersectionObserver)
 * - dpr dibatasi supaya laptop biasa tetap 60fps
 * - fallback statis untuk perangkat tanpa WebGL
 */
export default function SceneCanvas({
  children,
  camera = { position: [0, 0, 7], fov: 45 },
  className = ''
}) {
  const host = useRef()
  const [visible, setVisible] = useState(false)
  const [failed, setFailed] = useState(false)

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

  if (failed) {
    return <div ref={host} className={`scene-fallback ${className}`} />
  }

  return (
    <div ref={host} className={`scene-host ${className}`}>
      <Canvas
        camera={camera}
        dpr={[1, 1.75]}
        frameloop={visible ? 'always' : 'demand'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', () => setFailed(true))
        }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  )
}
