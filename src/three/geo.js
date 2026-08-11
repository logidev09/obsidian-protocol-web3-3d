import * as THREE from 'three'

/** Palet — cyberpunk yang diredam: dasar biru-arang, aksen teal/indigo/pasir. */
export const PALETTE = {
  ink: '#06080b',
  panel: '#0b1016',
  slate: '#8fa3bd',
  teal: '#3fd0c9',
  indigo: '#6f7dff',
  violet: '#a07cff',
  sand: '#e2c290'
}

/** PRNG deterministik supaya layout partikel stabil antar render. */
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

/** Sebaran titik merata di permukaan bola (spiral Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}

/** Interpolasi frame-rate independent. */
export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

export const clamp = THREE.MathUtils.clamp

/**
 * Rounded box low-poly tanpa dependensi tambahan:
 * extrude profil persegi bersudut membulat.
 */
export function roundedBoxGeometry(width, height, depth, radius = 0.2) {
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
    bevelThickness: depth * 0.18,
    bevelSize: depth * 0.16,
    bevelSegments: 1,
    curveSegments: 3
  })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

/** Deteksi perangkat lemah / hemat gerak — dipakai untuk menurunkan beban render. */
export function isLowPower() {
  if (typeof window === 'undefined') return false
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const smallCores = (navigator.hardwareConcurrency || 8) <= 4
  const narrow = window.innerWidth < 640
  return reduced || (smallCores && narrow)
}
