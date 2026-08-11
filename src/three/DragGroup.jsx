import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPerfProfile } from './geo'

/**
 * Wadah interaksi yang dipakai bersama oleh scene-scene 3D.
 *
 * - drag horizontal  -> yaw
 * - drag vertikal    -> pitch (dibatasi supaya objek tidak terbalik)
 * - lepas            -> inersia lalu kembali berputar pelan
 * - tanpa drag       -> objek condong halus mengikuti pointer (parallax)
 *
 * Yang penting untuk kenyamanan scroll: pointer capture hanya diambil setelah
 * gerakan horizontal melewati ambang kecil, sehingga swipe vertikal di layar
 * sentuh tetap menjadi scroll halaman, bukan rotasi objek.
 */
export default function DragGroup({
  children,
  autoSpin = 0.2,
  parallax = 1,
  maxPitch = 0.55,
  hitRadius = 3,
  ...props
}) {
  const group = useRef()
  const gl = useThree((s) => s.gl)

  const [dragging, setDragging] = useState(false)
  const state = useRef({
    yaw: 0,
    pitch: 0,
    velYaw: 0,
    velPitch: 0,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    armed: false,
    captured: false
  })

  const { reducedMotion } = getPerfProfile()

  useEffect(() => {
    gl.domElement.style.cursor = dragging ? 'grabbing' : 'grab'
    return () => {
      gl.domElement.style.cursor = 'auto'
    }
  }, [dragging, gl])

  const onDown = (e) => {
    e.stopPropagation()
    const s = state.current
    s.armed = true
    s.captured = false
    s.startX = e.clientX
    s.startY = e.clientY
    s.lastX = e.clientX
    s.lastY = e.clientY
  }

  const onMove = (e) => {
    const s = state.current
    if (!s.armed) return

    const dx = e.clientX - s.lastX
    const dy = e.clientY - s.lastY

    if (!s.captured) {
      const totalX = Math.abs(e.clientX - s.startX)
      const totalY = Math.abs(e.clientY - s.startY)
      // Belum cukup bergerak untuk disebut niat drag.
      if (totalX < 4 && totalY < 4) return
      // Gerakan didominasi vertikal -> biarkan jadi scroll halaman.
      if (totalY > totalX * 1.2) {
        s.armed = false
        return
      }
      e.target.setPointerCapture?.(e.pointerId)
      s.captured = true
      setDragging(true)
    }

    s.velYaw = dx * 0.005
    s.velPitch = dy * 0.004
    s.yaw += s.velYaw
    s.pitch = THREE.MathUtils.clamp(s.pitch + s.velPitch, -maxPitch, maxPitch)
    s.lastX = e.clientX
    s.lastY = e.clientY
  }

  const onUp = (e) => {
    const s = state.current
    if (s.captured) e.target.releasePointerCapture?.(e.pointerId)
    s.armed = false
    s.captured = false
    setDragging(false)
  }

  useFrame((frame, delta) => {
    const g = group.current
    if (!g) return
    const s = state.current
    const dt = Math.min(delta, 0.05)

    if (!s.captured) {
      // Inersia setelah dilepas.
      s.velYaw *= 0.94
      s.velPitch *= 0.9
      s.yaw += s.velYaw
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.velPitch, -maxPitch, maxPitch)

      if (!reducedMotion) s.yaw += autoSpin * dt
      // Pitch perlahan kembali ke netral.
      s.pitch = THREE.MathUtils.damp(s.pitch, 0, 1.2, dt)
    }

    const px = reducedMotion ? 0 : frame.pointer.x * 0.12 * parallax
    const py = reducedMotion ? 0 : frame.pointer.y * 0.08 * parallax

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.yaw + px, 8, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -s.pitch + py, 8, dt)
  })

  return (
    <group ref={group} {...props}>
      {/* Bidang tangkap tak terlihat supaya drag terasa di sekitar objek,
          bukan hanya tepat di permukaannya. */}
      <mesh
        visible={false}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <sphereGeometry args={[hitRadius, 12, 8]} />
        <meshBasicMaterial />
      </mesh>
      {children}
    </group>
  )
}
