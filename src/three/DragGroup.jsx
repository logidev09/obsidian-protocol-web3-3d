import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPerfProfile } from './geo'

/**
 * Wadah interaksi mouse untuk objek 3D.
 *
 * - drag kiri/sentuh  : putar objek bebas (yaw + pitch, dengan inersia)
 * - lepas             : objek melambat halus lalu kembali berputar pelan
 * - gerak mouse biasa : parallax lembut mengikuti kursor
 *
 * Halaman tetap bisa di-scroll di atas canvas: pointer capture hanya aktif
 * setelah pointer benar-benar ditekan, dan sentuhan vertikal murni tidak
 * dibajak (dibiarkan jadi scroll).
 */
export default function DragGroup({
  children,
  autoSpin = 0.2,
  parallax = 1,
  hitRadius = 3,
  maxPitch = 0.85,
  ...props
}) {
  const group = useRef()
  const { gl } = useThree()
  const { reducedMotion } = getPerfProfile()

  const [dragging, setDragging] = useState(false)
  const state = useRef({
    yaw: 0,
    pitch: 0,
    vYaw: 0,
    vPitch: 0,
    lastX: 0,
    lastY: 0,
    pointerId: null,
    axisLocked: false,
    horizontal: false,
    pointer: new THREE.Vector2()
  })

  useEffect(() => {
    gl.domElement.style.cursor = dragging ? 'grabbing' : 'grab'
    return () => {
      gl.domElement.style.cursor = 'auto'
    }
  }, [dragging, gl])

  const begin = (e) => {
    const s = state.current
    e.stopPropagation()
    s.pointerId = e.pointerId
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.axisLocked = e.pointerType !== 'touch'
    s.horizontal = e.pointerType !== 'touch'
    setDragging(true)
  }

  const move = (e) => {
    const s = state.current
    if (s.pointerId !== e.pointerId) return

    const dx = e.clientX - s.lastX
    const dy = e.clientY - s.lastY

    // Di layar sentuh: tentukan dulu arah gerakan. Kalau vertikal, lepaskan
    // kendali supaya jadi scroll halaman, bukan rotasi objek.
    if (!s.axisLocked) {
      if (Math.abs(dx) + Math.abs(dy) < 6) return
      s.axisLocked = true
      s.horizontal = Math.abs(dx) > Math.abs(dy)
      if (!s.horizontal) {
        s.pointerId = null
        setDragging(false)
        return
      }
      e.target.setPointerCapture?.(e.pointerId)
    }

    s.lastX = e.clientX
    s.lastY = e.clientY
    s.vYaw = dx * 0.005
    s.vPitch = dy * 0.004
    s.yaw += s.vYaw
    s.pitch = THREE.MathUtils.clamp(s.pitch + s.vPitch, -maxPitch, maxPitch)
  }

  const end = (e) => {
    const s = state.current
    if (s.pointerId !== e?.pointerId && e) return
    s.pointerId = null
    s.axisLocked = false
    setDragging(false)
  }

  useFrame((frame, delta) => {
    const g = group.current
    const s = state.current
    if (!g) return

    const dt = Math.min(delta, 0.05)

    if (!dragging) {
      // inersia: sisa kecepatan diteruskan lalu diredam
      s.yaw += s.vYaw
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.vPitch, -maxPitch, maxPitch)
      s.vYaw *= 0.92
      s.vPitch *= 0.92
      if (!reducedMotion) s.yaw += autoSpin * dt
      s.pitch = THREE.MathUtils.damp(s.pitch, 0, 1.1, dt)
    }

    s.pointer.lerp(frame.pointer, 0.06)

    g.rotation.y = s.yaw + s.pointer.x * 0.18 * parallax
    g.rotation.x = s.pitch + -s.pointer.y * 0.12 * parallax
    g.position.x = THREE.MathUtils.damp(g.position.x, s.pointer.x * 0.22 * parallax, 4, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, s.pointer.y * 0.16 * parallax, 4, dt)
  })

  return (
    <group ref={group} {...props}>
      {/* bidang tangkap transparan supaya drag terasa di area luas, bukan cuma di permukaan objek */}
      <mesh
        visible={false}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      >
        <sphereGeometry args={[hitRadius, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {children}
    </group>
  )
}
