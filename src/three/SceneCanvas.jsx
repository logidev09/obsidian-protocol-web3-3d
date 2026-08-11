import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

const SCENES = {
  hero: lazy(() => import('./HeroScene')),
  product: lazy(() => import('./ProductScene')),
  network: lazy(() => import('./NetworkScene')),
  ledger: lazy(() => import('./LedgerScene'))
}

/**
 * Canvas hemat resource.
 *
 * 1. Canvas baru dimount saat section mendekati viewport.
 * 2. frameloop jadi "never" begitu section keluar layar, jadi GPU idle dan
 *    scroll tidak pernah bersaing dengan render loop yang tak terlihat.
 * 3. touch-action pan-y: swipe vertikal selalu jadi scroll halaman.
 */
export default function SceneCanvas({ scene, camera = [0, 0, 7], fov = 42, className = '' }) {
  const holder = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const { dpr, low } = getPerfProfile()

  useEffect(() => {
    const el = holder.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setActive(entry.isIntersecting)
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Scene = SCENES[scene]

  return (
    <div ref={holder} className={`canvas-holder ${className}`} data-scene={scene}>
      {mounted && (
        <Canvas
          dpr={dpr}
          frameloop={active ? 'always' : 'never'}
          camera={{ position: camera, fov }}
          gl={{
            antialias: !low,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false
          }}
          style={{ touchAction: 'pan-y' }}
          onCreated={({ gl }) => gl.setClearAlpha(0)}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}
