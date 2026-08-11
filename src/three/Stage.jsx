import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useInView } from './useDragRotate'
import { useIsLowPower } from '../lib/hooks'

/**
 * Wrapper canvas: transparan, DPR adaptif, dan berhenti render saat keluar viewport.
 * `hint` = teks kecil "drag to rotate" di pojok.
 */
export default function Stage({
  children,
  camera = { position: [0, 0, 6], fov: 42 },
  className = '',
  hint = 'drag · rotate',
  style
}) {
  const [ref, inView] = useInView()
  const low = useIsLowPower()

  return (
    <div ref={ref} className={`stage ${className}`} style={style}>
      <Canvas
        frameloop={inView ? 'always' : 'never'}
        dpr={low ? [1, 1.25] : [1, 1.85]}
        camera={camera}
        gl={{
          antialias: !low,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
      {hint && <span className="stage-hint mono">{hint}</span>}
    </div>
  )
}
