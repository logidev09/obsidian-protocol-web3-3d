import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerfProfile } from './geo'

/**
 * Pembungkus <Canvas> yang sadar viewport.
 *
 * Scene hanya di-mount saat mendekati layar, dan frameloop dimatikan
 * begitu keluar layar atau tab tidak aktif. Ini kunci supaya halaman
 * dengan 4 scene WebGL tetap enak di-scroll.
 */
export default function SceneCanvas({
  children,
  camera = { position: [0, 0, 6], fov: 42 },
  className = '',
  eventPrefix,
  onCreated
}) {
  const host = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const profile = getPerfProfile()

  useEffect(() => {
    const el = host.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setActive(entry.isIntersecting)
      },
      { rootMargin: '260px 0px', threshold: 0.01 }
    )
    io.observe(el)

    const onVisibility = () => {
      if (document.hidden) setActive(false)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div ref={host} className={`scene-host ${className}`}>
      {mounted && (
        <Canvas
          dpr={profile.dpr}
          camera={camera}
          frameloop={active ? 'always' : 'never'}
          eventPrefix={eventPrefix}
          gl={{ antialias: !profile.low, alpha: true, powerPreference: 'high-performance' }}
          onCreated={onCreated}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
      <div className="scene-noise" aria-hidden="true" />
    </div>
  )
}
