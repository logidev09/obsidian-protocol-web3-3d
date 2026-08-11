import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Kontrol rotasi berbasis pointer — sengaja tidak memakai OrbitControls.
 *
 * Alasannya penting untuk kenyamanan scroll: OrbitControls mengikat event
 * wheel ke canvas, sehingga scroll halaman "tersangkut" saat kursor berada
 * di atas objek 3D. Di sini hanya drag horizontal/vertikal yang ditangkap;
 * wheel dibiarkan lewat sepenuhnya ke dokumen.
 *
 * - Diam → objek berputar pelan sendiri
 * - Hover → mengikuti pointer secara halus (parallax)
 * - Drag → rotasi manual dengan inersia, lalu melambat kembali
 */
export default function DragGroup({
  children,
  autoSpin = 1,
  parallax = 0.6,
  scale = 1,
  lockX = false
}) {
  const group = useRef()
  const velocity = useRef({ x: 0, y: 0 })
  const manual = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const [grabbing, setGrabbing] = useState(false)
  const { gl } = useThree()

  const setCursor = (value) => {
    gl.domElement.style.cursor = value
  }

  const onDown = (e) => {
    e.stopPropagation()
    dragging.current = true
    setGrabbing(true)
    last.current = { x: e.clientX, y: e.clientY }
    e.target.setPointerCapture?.(e.pointerId)
    setCursor('grabbing')
  }

  const onMove = (e) => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    velocity.current.y = dx * 0.005
    if (!lockX) velocity.current.x = dy * 0.004
    manual.current.y += velocity.current.y
    if (!lockX) manual.current.x += velocity.current.x
  }

  const onUp = (e) => {
    dragging.current = false
    setGrabbing(false)
    e.target?.releasePointerCapture?.(e.pointerId)
    setCursor('grab')
  }

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)

    if (!dragging.current) {
      // inersia meluruh
      velocity.current.y *= 0.94
      velocity.current.x *= 0.94
      manual.current.y += velocity.current.y
      if (!lockX) manual.current.x += velocity.current.x
      // putaran ambien
      manual.current.y += dt * 0.12 * autoSpin
    }

    const px = state.pointer.x * parallax * 0.35
    const py = -state.pointer.y * parallax * 0.28

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, manual.current.y + px, 6, dt)
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      THREE.MathUtils.clamp(manual.current.x + py, -0.85, 0.85),
      6,
      dt
    )

    const target = grabbing ? scale * 1.03 : scale
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x || scale, target, 6, dt))
  })

  return (
    <group
      ref={group}
      scale={scale}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerOver={() => setCursor('grab')}
      onPointerOut={() => {
        if (!dragging.current) setCursor('auto')
      }}
    >
      {children}
    </group>
  )
}
