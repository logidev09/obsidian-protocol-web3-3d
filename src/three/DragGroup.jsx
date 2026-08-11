import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPerfProfile } from './geo'

/**
 * Wadah interaksi mouse untuk objek 3D.
 *
 * - Drag (tekan + geser) memutar objek pada sumbu Y dan X, dengan inersia.
 * - Tanpa drag, objek berputar pelan sendiri + condong mengikuti pointer.
 * - Sumbu X dibatasi agar objek tidak pernah terbalik.
 *
 * Kenyamanan scroll: komponen ini tidak pernah menangkap event wheel/touch
 * vertikal, jadi scroll halaman selalu lolos ke browser.
 */
export default function DragGroup({
  children,
  autoSpin = 0.2,
  parallax = 1,
  hitRadius = 3,
  maxPitch = 0.55
}) {
  const group = useRef()
  const state = useRef({ x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 })
  const [dragging, setDragging] = useState(false)
  const { gl, pointer } = useThree()
  const { reducedMotion } = getPerfProfile()

  const setCursor = (value) => {
    gl.domElement.style.cursor = value
  }

  const onPointerDown = (e) => {
    e.stopPropagation()
    e.target.setPointerCapture?.(e.pointerId)
    setDragging(true)
    setCursor('grabbing')
    state.current.px = e.clientX
    state.current.py = e.clientY
  }

  const onPointerMove = (e) => {
    if (!dragging) return
    const s = state.current
    const dx = (e.clientX - s.px) / 220
    const dy = (e.clientY - s.py) / 260
    s.px = e.clientX
    s.py = e.clientY
    s.vx = dy
    s.vy = dx
    s.x = THREE.MathUtils.clamp(s.x + dy, -maxPitch, maxPitch)
    s.y += dx
  }

  const endDrag = (e) => {
    if (!dragging) return
    e?.target?.releasePointerCapture?.(e.pointerId)
    setDragging(false)
    setCursor('grab')
  }

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    const s = state.current
    const dt = Math.min(delta, 0.05)

    if (!dragging) {
      s.x = THREE.MathUtils.clamp(s.x + s.vx, -maxPitch, maxPitch)
      s.y += s.vy + (reducedMotion ? 0 : autoSpin * dt)
      s.vx *= 0.92
      s.vy *= 0.94

      const lean = parallax * 0.12
      s.x = THREE.MathUtils.clamp(s.x + pointer.y * lean * dt, -maxPitch, maxPitch)
      s.y += pointer.x * lean * dt
    }

    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.x, 9, dt)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.y, 9, dt)
  })

  return (
    <group ref={group}>
      <mesh
        visible={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerOver={() => !dragging && setCursor('grab')}
        onPointerOut={() => !dragging && setCursor('auto')}
      >
        <sphereGeometry args={[hitRadius, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      {children}
    </group>
  )
}
