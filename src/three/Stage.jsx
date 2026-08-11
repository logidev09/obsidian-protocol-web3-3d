import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useInViewport } from '../lib/hooks'

/**
 * Pembungkus canvas: hanya mount saat section dekat viewport,
 * DPR dibatasi, latar transparan supaya menyatu dengan halaman.
 */
export default function Stage({
  children,
  tag,
  readout,
  className = 'stage',
  camera = { position: [0, 0, 5.4], fov: 42 },
  style
}) {
  const [ref, inView] = useInViewport('300px')

  return (
    <div ref={ref} className={className} style={style}>
      {inView ? (
        <Canvas
          dpr={[1, 1.75]}
          camera={camera}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      ) : (
        <div className="canvas-fallback">initializing render</div>
      )}

      {tag ? <div className="stage-tag">{tag}</div> : null}
      {readout !== undefined ? (
        <div className={readout ? 'stage-readout on' : 'stage-readout'}>{readout || '\u00a0'}</div>
      ) : null}
    </div>
  )
}
