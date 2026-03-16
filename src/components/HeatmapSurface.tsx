"use client"

import { useMemo, useRef } from "react"
import { useDataset } from "@/store/useDataset"
import { generateHeatmapGrid } from "@/lib/interpolate"
import HoverInfo from "./HoverInfo"
import * as THREE from "three"
import { RoomHeatmap } from "@/types/heatmap"

export default function HeatmapSurface({
  dataset,
  signal,
  quality = 1,
}: {
  dataset: RoomHeatmap | null
  signal: "wifi" | "lte" | "nr"
  quality?: number
}) {
  const meshRef = useRef<any>(null)

  const geometry = useMemo(() => {
    if (!dataset) return null

    const safePoints = dataset.points.map((p) => ({
      x: p.x,
      y: p.y,
      wifiRssi:
        signal === "wifi"
          ? p.wifiRssi ?? -90
          : signal === "lte"
          ? p.lteRsrp ?? -120
          : p.nrRsrp ?? -120,
    }))

    // adaptive resolution: aim for ~200 cells along longest side,
    // then adjust by quality multiplier (higher = finer).
    const resolution = (() => {
      const maxCells = 200
      const largest = Math.max(dataset.width, dataset.height)
      const base = largest / maxCells
      let r = Math.max(0.1, Math.min(0.5, base))
      r = r / (quality || 1)
      // re-clamp in case quality pushed beyond bounds
      return Math.max(0.05, Math.min(1, r))
    })()

    const { grid, rows, cols, resolution: cellSize, mask } =
      generateHeatmapGrid(
        safePoints,
        dataset.width,
        dataset.height,
        resolution,
        dataset.validAreas
      )

    const vertices: number[] = []
    const colors: number[] = []
    const indices: number[] = []

    // map from grid coordinate to vertex index (or -1 if skipped)
    const indexMap: number[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(-1))


    const rssiToHeight = (rssi: number) => {
      const t = (rssi + 120) / 70
      return Math.max(0, t) * 3
    }

    const rssiToColor = (rssi: number) => {
      const t = Math.max(0, Math.min((rssi + 120) / 70, 1))
      const hue = t * 0.33
      const c = new THREE.Color()
      c.setHSL(hue, 1, 0.5)
      return c
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!mask[y][x]) {
          // leave indexMap[y][x] = -1
          continue
        }

        const rssi = grid[y][x]
        indexMap[y][x] = vertices.length / 3 // each vertex has 3 components

        vertices.push(
          x * cellSize,
          rssiToHeight(rssi),
          y * cellSize
        )

        const c = rssiToColor(rssi)
        colors.push(c.r, c.g, c.b)
      }
    }

    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        // only create faces if all four corners are valid
        const i00 = indexMap[y][x]
        const i10 = indexMap[y][x + 1]
        const i01 = indexMap[y + 1][x]
        const i11 = indexMap[y + 1][x + 1]
        if (i00 !== -1 && i10 !== -1 && i01 !== -1) {
          indices.push(i00, i01, i10)
        }
        if (i10 !== -1 && i01 !== -1 && i11 !== -1) {
          indices.push(i10, i01, i11)
        }
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return geo
  }, [dataset, signal, quality])

  if (!geometry || !dataset) return null

  return (
    <group position={[-dataset.width / 2, 0, -dataset.height / 2]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      <HoverInfo meshRef={meshRef} />
    </group>
  )
}