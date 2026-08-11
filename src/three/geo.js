import * as THREE from 'three'

/**
 * Palet "muted cyberpunk": gelap, dingin, dengan dua aksen
 * berintensitas rendah. Sengaja menghindari magenta/cyan neon penuh.
 */
export const PALETTE = {
  ink: '#0b1016',
  slate: '#3d4a58',
  steel: '#6b7f92',
  teal: '#4fd1c5',
  indigo: '#5b6ee0',
  violet: '#8b6ee0',
  sand: '#d8c8a0'
}

/** Kotak dengan sudut membulat, dibangun dari Shape + ExtrudeGeometry. */
export function roundedBoxGeometry(w, h, d, r) {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 6
  })
  geo.center()
  return geo
}

/** Titik-titik terdistribusi merata di permukaan bola (Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    pts.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    )
  }
  return pts
}
