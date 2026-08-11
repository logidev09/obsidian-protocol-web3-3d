import * as THREE from 'three'

/** Palet: gelap, sedikit desaturasi. Cyberpunk tanpa neon norak. */
export const PALETTE = {
  ink: '#06080b',
  slate: '#8f9bb0',
  steel: '#5b6676',
  teal: '#4fd1c5',
  indigo: '#6d7cff',
  violet: '#9a7bd6',
  sand: '#d8b98a'
}

/** Interpolasi yang stabil terhadap frame rate. */
export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

/** PRNG deterministik supaya bentuk low-poly konsisten tiap reload. */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box dengan sudut membulat, dibangun dari extrude shape (tanpa asset eksternal). */
export function roundedBoxGeometry(width, height, depth, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  const w = width / 2 - r
  const h = height / 2 - r
  const shape = new THREE.Shape()

  shape.moveTo(-w - r, -h)
  shape.lineTo(-w - r, h)
  shape.quadraticCurveTo(-w - r, h + r, -w, h + r)
  shape.lineTo(w, h + r)
  shape.quadraticCurveTo(w + r, h + r, w + r, h)
  shape.lineTo(w + r, -h)
  shape.quadraticCurveTo(w + r, -h - r, w, -h - r)
  shape.lineTo(-w, -h - r)
  shape.quadraticCurveTo(-w - r, -h - r, -w - r, -h)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.14,
    bevelSize: depth * 0.12,
    bevelSegments: 2,
    curveSegments: 6
  })

  geo.center()
  geo.computeVertexNormals()
  return geo
}

/** Titik-titik pada bola (fibonacci sphere) untuk node jaringan. */
export function fibonacciSphere(count, radius) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }

  return points
}
