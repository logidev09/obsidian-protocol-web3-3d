import * as THREE from 'three'

/** Kotak dengan sudut membulat (extrude) — dipakai untuk badan perangkat. */
export function roundedBoxGeometry(w, h, d, r = 0.08, curve = 5) {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001)

  shape.moveTo(x + rr, y)
  shape.lineTo(x + w - rr, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + rr)
  shape.lineTo(x + w, y + h - rr)
  shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  shape.lineTo(x + rr, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - rr)
  shape.lineTo(x, y + rr)
  shape.quadraticCurveTo(x, y, x + rr, y)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 2,
    curveSegments: curve
  })
  geo.translate(0, 0, -d / 2)
  geo.computeVertexNormals()
  return geo
}

/** Titik acak stabil (seeded) di dalam bola — node jaringan. */
export function seededNodes(count, radius = 1.6, seed = 7) {
  let s = seed
  const rand = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  const pts = []
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1
    const theta = rand() * Math.PI * 2
    const r = radius * Math.cbrt(0.35 + rand() * 0.65)
    const sq = Math.sqrt(1 - u * u)
    pts.push(new THREE.Vector3(r * sq * Math.cos(theta), r * sq * Math.sin(theta) * 0.78, r * u))
  }
  return pts
}

/** Segmen antar node terdekat — rangka jaringan. */
export function nearestSegments(points, maxDist = 1.15, maxLinks = 3) {
  const out = []
  for (let i = 0; i < points.length; i++) {
    const near = []
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue
      const d = points[i].distanceTo(points[j])
      if (d < maxDist) near.push({ j, d })
    }
    near.sort((a, b) => a.d - b.d)
    near.slice(0, maxLinks).forEach(({ j }) => {
      if (i < j) out.push(points[i], points[j])
    })
  }
  return out
}

export const PALETTE = {
  steel: '#7d879b',
  deep: '#2a3242',
  indigo: '#7c8cff',
  teal: '#3fbfae',
  sand: '#c9a86a',
  ink: '#0a0e14'
}
