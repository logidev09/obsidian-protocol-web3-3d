import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

/**
 * Wrapper Canvas standar untuk semua scene.
 * - frameloop dimatikan saat section di luar viewport -> scroll tetap ringan
 * - dpr dibatasi 1.6 supaya layar retina tidak membakar GPU
 * - kamera tidak pernah menangkap wheel event, jadi scroll halaman tidak terkunci
 */
export default function Stage({
  children,
  active = true,
  camera = { position: [0, 0, 6], fov: 42 },
  className = ''
}) {
  return (
    <Canvas
      className={className}
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={camera}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}
