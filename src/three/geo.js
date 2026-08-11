import * as THREE from 'three'

/**
 * Palet "muted cyberpunk".
 * Sengaja desaturasi: tidak ada neon pink/hijau stabilo.
 * Basisnya biru-abu dingin, aksen teal redup + amber hangat sebagai kontras.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0b0f14',
  slate: '#182029',
  steel: '#5f6f80',
  mist: '#c3ced9',
  teal: '#3fb0a4',
  indigo: '#4b5aa6',
  amber: '#c98f4e'
}

/** PRNG deterministik (mulberry32) supaya layout partikel konsisten tiap render. */
export function seededRandom(seed = 1) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Balok dengan sudut membulat di bidang XZ (tampak atas),
 * dibangun dari Shape + ExtrudeGeometry lalu di-center.
 */
export function roundedBoxGeometry(width, height, depth, radius = 0.1) {
  const w = width / 2
  const d = depth / 2
  const r = Math.min(radius, w - 0.001, d - 0.001)

  const shape = new THREE.Shape()
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
    bevelEnabled: false,
    curveSegments: 6
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, -height / 2, 0)
  geo.computeVertexNormals()
  return geo
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
