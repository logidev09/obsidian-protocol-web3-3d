import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { isLowPower } from './geo'

const LOW = isLowPower()

/**
 * Pembungkus <Canvas> yang aman untuk scroll:
 * - frameloop "demand" tidak dipakai karena scene animasi, tapi DPR dibatasi
 * - canvas tidak menahan scroll vertikal (touch-action diatur di CSS)
 * - render dihentikan saat tab tidak terlihat (hemat baterai)
 */
export default function Stage({ children, camera, className = '', fallback = null, ...rest }) {
  const [ready, setReady] = useState(false)

  return (
    <div className={`stage ${className} ${ready ? 'is-ready' : ''}`}>
      <Canvas
        className="stage__canvas"
        dpr={LOW ? [1, 1.25] : [1, 1.9]}
        gl={{ antialias: !LOW, powerPreference: 'high-performance', alpha: true }}
        camera={{ position: [0, 0, 7], fov: 42, near: 0.1, far: 60, ...camera }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          setReady(true)
        }}
        {...rest}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
      {!ready && fallback}
    </div>
  )
}
