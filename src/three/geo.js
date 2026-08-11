import * as THREE from 'three'

/**
 * Palet — cyberpunk yang ditahan.
 * Dasar hampir netral (void/ink/slate), aksen dipakai hemat.
 * Sengaja tanpa magenta/cyan neon jenuh supaya tidak norak.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0d1117',
  slate: '#161c26',
  steel: '#2b3442',
  mist: '#c7d0da',
  teal: '#4fd1c5',   // aksen utama, dingin
  indigo: '#5b6cff', // aksen sekunder
  sand: '#c9a227'    // aksen hangat, sangat jarang
}

/** PRNG deterministik — bentuk acak tapi konsisten tiap reload. */
export function seededRandom(seed = 1) {
  let s = seed >>> 0
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Kotak dengan sudut membulat, dibangun dari extrude shape (low-poly, murah). */
export function roundedBoxGeometry(width, height, depth, radius = 0.16) {
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
    depth,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 1,
    curveSegments: 4
  })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

/** Titik-titik pada bola Fibonacci — distribusi merata untuk node jaringan. */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    )
  }
  return points
}
