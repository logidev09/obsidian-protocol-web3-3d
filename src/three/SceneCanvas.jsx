import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

/**
 * Pembungkus <Canvas> dengan setelan yang ramah performa:
 * - frameloop "demand" tidak dipakai karena scene animatif, tapi DPR dibatasi
 * - render di-pause saat canvas keluar viewport (lihat prop `active`)
 */
export default function SceneCanvas({
  children,
  camera = { position: [0, 0, 6], fov: 45 },
  active = true,
  className = ''
}) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.8]}
      camera={camera}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}
