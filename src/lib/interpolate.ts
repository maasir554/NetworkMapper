export type Point = {
  x: number
  y: number
  wifiRssi: number
}

// Inverse Distance Weighting interpolation
export function generateHeatmapGrid(
  points: Point[],
  width: number,
  height: number,
  resolution = 0.3, // meters per cell
  maskRects?: { x: number; y: number; width: number; height: number }[]
) {
  const grid: number[][] = []
  const mask: boolean[][] = []

  const cols = Math.floor(width / resolution)
  const rows = Math.floor(height / resolution)

  const power = 2 // IDW exponent (2 is standard)

  const isInsideMask = (gx: number, gy: number) => {
    if (!maskRects || maskRects.length === 0) return true
    return maskRects.some(
      (r) => gx >= r.x && gy >= r.y && gx <= r.x + r.width && gy <= r.y + r.height
    )
  }

  for (let y = 0; y < rows; y++) {
    const row: number[] = []
    const maskRow: boolean[] = []

    for (let x = 0; x < cols; x++) {
      const gx = x * resolution
      const gy = y * resolution

      maskRow.push(isInsideMask(gx, gy))

      let numerator = 0
      let denominator = 0

      for (const p of points) {
        const dx = gx - p.x
        const dy = gy - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        const w = 1 / Math.pow(dist + 0.0001, power)

        numerator += w * p.wifiRssi
        denominator += w
      }

      row.push(numerator / denominator)
    }

    grid.push(row)
    mask.push(maskRow)
  }

  return { grid, rows, cols, resolution, mask }
}