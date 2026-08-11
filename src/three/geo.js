import * as THREE from 'three'

/**
 * Palet: cyberpunk tapi kalem. Tidak ada magenta/cyan neon jenuh —
 * semua warna diturunkan saturasinya dan dipakai sebagai aksen, bukan bidang besar.
 */
export const PALETTE = {
  void: '#06080b',
  panel: '#111a24',
  slate: '#8fa3b8',
  teal: '#4fb3a5',
  indigo: '#5b6ee1',
  violet: '#8a6fd1',
  sand: '#d8b46a'
}

/** Interpolasi yang stabil terhadap frame-rate (pengganti lerp mentah). */
export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

export const clamp = THREE.MathUtils.clamp

/** Sebaran titik merata di permukaan bola — dipakai untuk partikel & node jaringan. */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const offset = 2 / count
  const increment = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const phi = i * increment
    points.push(
      new THREE.Vector3(Math.cos(phi) * r * radius, y * radius, Math.sin(phi) * r * radius)
    )
  }
  return points
}

/** Box bersudut membulat via extrude — supaya perangkat 3D tidak terlihat kotak murahan. */
export function roundedBoxGeometry(width, height, depth, radius = 0.2, steps = 6) {
  const w = width / 2 - radius
  const h = height / 2 - radius
  const shape = new THREE.Shape()
  shape.moveTo(-w, -h - radius)
  shape.lineTo(w, -h - radius)
  shape.quadraticCurveTo(w + radius, -h - radius, w + radius, -h)
  shape.lineTo(w + radius, h)
  shape.quadraticCurveTo(w + radius, h + radius, w, h + radius)
  shape.lineTo(-w, h + radius)
  shape.quadraticCurveTo(-w - radius, h + radius, -w - radius, h)
  shape.lineTo(-w - radius, -h)
  shape.quadraticCurveTo(-w - radius, -h - radius, -w, -h - radius)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - radius * 0.5,
    bevelEnabled: true,
    bevelThickness: radius * 0.35,
    bevelSize: radius * 0.35,
    bevelSegments: steps,
    curveSegments: steps
  })
  geo.center()
  return geo
}

/** Garis lengkung antar dua titik di permukaan bola. */
export function arcBetween(a, b, lift = 0.35, segments = 24) {
  const mid = a.clone().add(b).multiplyScalar(0.5)
  mid.normalize().multiplyScalar(a.length() * (1 + lift))
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
  return curve.getPoints(segments)
}
