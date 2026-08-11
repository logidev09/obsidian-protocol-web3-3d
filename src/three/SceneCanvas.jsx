import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

const perf = getPerfProfile()

/**
 * Pembungkus Canvas standar untuk semua section.
 *
 * Dua hal penting untuk kenyamanan scroll:
 * 1. `frameloop="demand"` tidak dipakai (kita butuh animasi), tapi setiap
 *    canvas hanya di-mount saat section-nya terlihat (lihat useInView).
 * 2. `touch-action: pan-y` di style, sehingga di mobile jari tetap bisa
 *    men-scroll halaman walaupun menyentuh area 3D.
 */
export default function SceneCanvas({ children, camera, className = '', ...rest }) {
  return (
    <Canvas
      className={`scene-canvas ${className}`}
      dpr={perf.dpr}
      gl={{ antialias: !perf.low, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 42, position: [0, 0, 7], ...camera }}
      style={{ touchAction: 'pan-y' }}
      {...rest}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}
