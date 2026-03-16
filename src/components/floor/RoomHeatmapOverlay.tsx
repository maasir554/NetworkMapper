"use client"

import { useEffect, useRef, useMemo } from "react"
import { RoomHeatmap } from "@/types/heatmap"
import { generateHeatmapGrid } from "@/lib/interpolate"
import { useDataset } from "@/store/useDataset"

export default function RoomHeatmapOverlay({
  dataset,
  widthM,
  heightM,
  scale,
  quality = 1,
}: {
  dataset: RoomHeatmap
  widthM: number
  heightM: number
  scale: number
  quality?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signal = useDataset((s) => s.signal)

  const BASE_SCALE = 60
  const transform = scale / BASE_SCALE

  const gridMemo = useMemo(() => {
    if (!dataset) return null
    const safePoints = dataset.points.map(p => {
      let val = -120
      if (signal === "wifi") val = p.wifiRssi ?? -90
      else if (signal === "lte") val = p.lteRsrp ?? -120
      else if (signal === "nr") val = p.nrRsrp ?? -120
      return { x: p.x, y: p.y, wifiRssi: val }
    })
    // compute adaptive resolution for overlay
    const res = (() => {
      const maxCells = 200
      const largest = Math.max(widthM, heightM)
      const base = largest / maxCells
      let r = Math.max(0.05, Math.min(0.3, base))
      r = r / (quality || 1)
      return Math.max(0.02, Math.min(0.5, r))
    })()
    return generateHeatmapGrid(
      safePoints,
      widthM,
      heightM,
      res,
      dataset.validAreas
    )
  }, [dataset, signal, widthM, heightM, quality])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !gridMemo) return
    const { grid, rows, cols, resolution, mask } = gridMemo

    canvas.width = widthM * BASE_SCALE
    canvas.height = heightM * BASE_SCALE
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rssiToColor = (rssi: number) => {
      const t = Math.max(0, Math.min((rssi + 120) / 70, 1))
      const hue = t * 0.33
      return `hsl(${hue * 360},100%,50%)`
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (mask && !mask[y][x]) continue
        const rssi = grid[y][x]
        ctx.fillStyle = rssiToColor(rssi)
        const gx = x * resolution * BASE_SCALE
        const gy = y * resolution * BASE_SCALE
        ctx.fillRect(gx, gy, resolution * BASE_SCALE, resolution * BASE_SCALE)
      }
    }
  }, [gridMemo])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        transform: `scale(${transform})`,
        transformOrigin: "0 0",
      }}
    />
  )
}
