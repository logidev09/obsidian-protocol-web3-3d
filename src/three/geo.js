import * as THREE from 'three'

/**
 * Palet — sengaja diredam.
 * Dasarnya abu-abu kebiruan dingin; aksen teal/indigo dipakai tipis,
 * amber hanya untuk sinyal kecil. Tidak ada neon jenuh (#00ffff, #ff00ff).
 */
export const PALETTE = {
  void: '#06080b',
  slate: '#161d25',
  steel: '#2b3540',
  mist: '#c3ccd6',
  teal: '#4d9e93',
  indigo: '#5a67a8',
  amber: '#b8934a',
  rose: '#a8616b'
}

/** PRNG deterministik — supaya komposisi acak selalu sama tiap reload. */
export function seededRandom(seed = 1) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

let cachedProfile = null

/**
 * Profil performa kasar. Dipakai untuk menurunkan jumlah partikel & DPR
 * di perangkat lemah supaya scroll tetap halus.
 */
export function getPerfProfile() {
  if (cachedProfile) return cachedProfile
  if (typeof window === 'undefined') {
    cachedProfile = { low: false, dpr: [1, 1.6] }
    return cachedProfile
  }
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  const mobile = window.matchMedia('(max-width: 820px)').matches
  const low = cores <= 4 || mem <= 4 || mobile
  cachedProfile = { low, mobile, dpr: low ? [1, 1.35] : [1, 1.75] }
  return cachedProfile
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Rounded-rect 2D untuk di-extrude jadi bodi perangkat. */
function roundedRectShape(width, height, radius) {
  const w = width / 2
  const h = height / 2
  const r = Math.min(radius, w, h)
  const shape = new THREE.Shape()
  shape.moveTo(-w + r, -h)
  shape.lineTo(w - r, -h)
  shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(w, h - r)
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false)
  shape.lineTo(-w + r, h)
  shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(-w, -h + r)
  shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false)
  return shape
}

/**
 * Balok bersudut tumpul tanpa dependensi tambahan.
 * Dibangun dari extrude + bevel, lalu diputar supaya tebalnya di sumbu Y.
 */
export function roundedBoxGeometry(width, height, depth, radius = 0.15) {
  const bevel = Math.min(height / 2.2, radius * 0.55)
  const shape = roundedRectShape(width, depth, radius)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(height - bevel * 2, 0.01),
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 6
  })
  geo.center()
  geo.rotateX(-Math.PI / 2)
  geo.computeVertexNormals()
  return geo
}

/** Distribusi titik merata di permukaan bola (spiral Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2
    const r = Math.sqrt(Math.max(1 - y * y, 0))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}
