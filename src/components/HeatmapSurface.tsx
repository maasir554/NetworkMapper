"use client"

import { generateHeatmapGrid } from "@/lib/interpolate"
import { RoomHeatmap } from "@/types/heatmap"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import HoverInfo from "./HoverInfo"

export default function HeatmapSurface({
  dataset,
  signal,
  quality = 1,
}: {
  dataset: RoomHeatmap | null
  signal: "wifi" | "lte" | "nr"
  quality?: number
}) {
  const meshRef = useRef<THREE.Mesh | null>(null)

  const geometry = useMemo(() => {
    if (!dataset) return null

    const safePoints = dataset.points.map((point) => ({
      x: point.x,
      y: point.y,
      wifiRssi:
        signal === "wifi"
          ? point.wifiRssi ?? -90
          : signal === "lte"
            ? point.lteRsrp ?? -120
            : point.nrRsrp ?? -120,
    }))

    const resolution = (() => {
      const maxCells = 120
      const largest = Math.max(dataset.width, dataset.height)
      const base = largest / maxCells
      let current = Math.max(0.1, Math.min(0.5, base))
      current = current / (quality || 1)
      return Math.max(0.05, Math.min(1, current))
    })()

    const { grid, rows, cols, resolution: cellSize, mask } = generateHeatmapGrid(
      safePoints,
      dataset.width,
      dataset.height,
      resolution,
      dataset.validAreas
    )

    const vertices: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    const signalValues: number[] = []
    const indexMap: number[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(-1))

    const rssiToHeight = (value: number) => {
      const t = (value + 120) / 70
      return Math.max(0, t) * 3
    }

    const rssiToColor = (value: number) => {
      const t = Math.max(0, Math.min((value + 120) / 70, 1))
      const hue = t * 0.33
      const color = new THREE.Color()
      color.setHSL(hue, 0.9, 0.55)
      return color
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!mask[y][x]) continue

        const value = grid[y][x]
        indexMap[y][x] = vertices.length / 3
        vertices.push(x * cellSize, rssiToHeight(value), y * cellSize)
        signalValues.push(value)

        const color = rssiToColor(value)
        colors.push(color.r, color.g, color.b)
      }
    }

    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const i00 = indexMap[y][x]
        const i10 = indexMap[y][x + 1]
        const i01 = indexMap[y + 1][x]
        const i11 = indexMap[y + 1][x + 1]
        if (i00 !== -1 && i10 !== -1 && i01 !== -1) indices.push(i00, i01, i10)
        if (i10 !== -1 && i01 !== -1 && i11 !== -1) indices.push(i10, i01, i11)
      }
    }

    const geometryBuffer = new THREE.BufferGeometry()
    geometryBuffer.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
    geometryBuffer.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
    geometryBuffer.setAttribute("signalValue", new THREE.Float32BufferAttribute(signalValues, 1))
    geometryBuffer.setIndex(indices)
    geometryBuffer.computeVertexNormals()

    return geometryBuffer
  }, [dataset, quality, signal])

  if (!geometry || !dataset) return null

  return (
    <group position={[-dataset.width / 2, 0, -dataset.height / 2]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.38}
          metalness={0.08}
        />
      </mesh>
      <HoverInfo meshRef={meshRef} />
    </group>
  )
}
