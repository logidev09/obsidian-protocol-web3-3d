import * as THREE from 'three'

/**
 * Palet: cyberpunk yang direm.
 * Basis abu-biru dingin, aksen teal desaturasi + amber tembaga.
 * Sengaja menghindari neon magenta/cyan penuh saturasi.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0b0f14',
  slate: '#1a2029',
  steel: '#3b4654',
  mist: '#c9d2dc',
  teal: '#4a9a8f',
  indigo: '#5a6b9c',
  amber: '#c08a4e'
}

/** PRNG deterministik supaya layout acak tetap konsisten tiap render. */
export function seededRandom(seed = 1) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

/**
 * Box dengan sudut membulat, dibangun manual dari ExtrudeGeometry
 * supaya tidak perlu dependensi tambahan dan tetap low-poly.
 */
export function roundedBoxGeometry(width, height, depth, radius = 0.1, steps = 3) {
  const r = Math.min(radius, width / 2 - 0.001, depth / 2 - 0.001)
  const shape = new THREE.Shape()
  const w = width / 2
  const d = depth / 2

  shape.moveTo(-w + r, -d)
  shape.lineTo(w - r, -d)
  shape.quadraticCurveTo(w, -d, w, -d + r)
  shape.lineTo(w, d - r)
  shape.quadraticCurveTo(w, d, w - r, d)
  shape.lineTo(-w + r, d)
  shape.quadraticCurveTo(-w, d, -w, d - r)
  shape.lineTo(-w, -d + r)
  shape.quadraticCurveTo(-w, -d, -w + r, -d)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: height * 0.12,
    bevelSize: r * 0.25,
    bevelSegments: 1,
    curveSegments: steps
  })

  geo.rotateX(-Math.PI / 2)
  geo.center()
  geo.computeVertexNormals()
  return geo
}

/** Titik-titik pada bola dengan distribusi merata (fibonacci sphere). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    )
  }
  return points
}

/** Deteksi perangkat lemah / preferensi reduce-motion untuk menurunkan beban render. */
export function getPerfProfile() {
  if (typeof window === 'undefined') return { dpr: [1, 1.5], low: false, reduced: false }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cores = navigator.hardwareConcurrency || 4
  const mobile = window.matchMedia('(max-width: 820px)').matches
  const low = reduced || cores <= 4 || mobile
  return {
    reduced,
    low,
    dpr: low ? [1, 1.4] : [1, 1.9]
  }
}
