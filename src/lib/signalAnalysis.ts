import { generateHeatmapGrid } from "@/lib/interpolate"
import { SignalType } from "@/store/useDataset"
import { RoomHeatmap, SignalPoint } from "@/types/heatmap"

type AnalysisCell = {
  x: number
  y: number
  value: number
}

export type DeadzoneCluster = {
  id: string
  severity: "moderate" | "critical"
  areaM2: number
  minValue: number
  avgValue: number
  centroid: { x: number; y: number }
  bounds: { x: number; y: number; width: number; height: number }
}

export type RouterEstimate = {
  x: number
  y: number
  rationale: string
  label: string
  mathSummary: string
}

export type SignalAnalysis = {
  signal: SignalType
  average: number
  best: number
  worst: number
  samples: number
  threshold: number
  deadzones: DeadzoneCluster[]
  routerEstimate: RouterEstimate | null
  existingRouterEstimate: RouterEstimate | null
}

const signalThresholds: Record<SignalType, number> = {
  wifi: -72,
  lte: -105,
  nr: -100,
}

const signalLabels: Record<SignalType, string> = {
  wifi: "Wi-Fi RSSI",
  lte: "LTE RSRP",
  nr: "5G NR RSRP",
}

function getSignalValue(point: SignalPoint, signal: SignalType) {
  if (signal === "wifi") return point.wifiRssi
  if (signal === "lte") return point.lteRsrp
  return point.nrRsrp
}

function getAdaptiveResolution(dataset: RoomHeatmap) {
  const largest = Math.max(dataset.width, dataset.height)
  const base = largest / 60
  return Math.max(0.35, Math.min(0.75, base))
}

function buildDeadzones(
  grid: number[][],
  mask: boolean[][],
  resolution: number,
  threshold: number
) {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false))
  const clusters: DeadzoneCluster[] = []
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (visited[y][x] || !mask[y][x] || grid[y][x] > threshold) continue

      const queue: Array<[number, number]> = [[x, y]]
      const cells: AnalysisCell[] = []
      let total = 0
      let minValue = Number.POSITIVE_INFINITY
      let minX = Number.POSITIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY

      visited[y][x] = true

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!
        const value = grid[cy][cx]
        const worldX = cx * resolution + resolution / 2
        const worldY = cy * resolution + resolution / 2
        cells.push({ x: worldX, y: worldY, value })
        total += value
        minValue = Math.min(minValue, value)
        minX = Math.min(minX, worldX)
        minY = Math.min(minY, worldY)
        maxX = Math.max(maxX, worldX)
        maxY = Math.max(maxY, worldY)

        directions.forEach(([dx, dy]) => {
          const nx = cx + dx
          const ny = cy + dy
          if (
            nx < 0 ||
            ny < 0 ||
            nx >= cols ||
            ny >= rows ||
            visited[ny][nx] ||
            !mask[ny][nx] ||
            grid[ny][nx] > threshold
          ) return
          visited[ny][nx] = true
          queue.push([nx, ny])
        })
      }

      const areaM2 = cells.length * resolution * resolution
      if (areaM2 < 0.3) continue

      const centroid = cells.reduce(
        (acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }),
        { x: 0, y: 0 }
      )

      clusters.push({
        id: `deadzone-${clusters.length + 1}`,
        severity: minValue <= threshold - 8 ? "critical" : "moderate",
        areaM2,
        minValue,
        avgValue: total / cells.length,
        centroid: {
          x: centroid.x / cells.length,
          y: centroid.y / cells.length,
        },
        bounds: {
          x: Math.max(0, minX - resolution / 2),
          y: Math.max(0, minY - resolution / 2),
          width: maxX - minX + resolution,
          height: maxY - minY + resolution,
        },
      })
    }
  }

  return clusters.sort((a, b) => b.areaM2 - a.areaM2)
}

function estimateRouterPosition(
  dataset: RoomHeatmap,
  signal: SignalType,
  threshold: number,
  deadzones: DeadzoneCluster[],
  values: number[]
): RouterEstimate | null {
  if (signal !== "wifi") return null
  if (values.length < 4) return null

  const points = dataset.points
    .map((point) => {
      const value = getSignalValue(point, signal)
      return typeof value === "number" ? { x: point.x, y: point.y, value } : null
    })
    .filter((point): point is { x: number; y: number; value: number } => point !== null)

  if (points.length < 4) return null

  const strongCutoff =
    [...values].sort((a, b) => b - a)[Math.max(0, Math.floor(values.length * 0.2) - 1)] ??
    Math.max(...values)
  const strongPoints = points.filter((point) => point.value >= strongCutoff)
  const currentSource = strongPoints.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  )
  const sourceCentroid = strongPoints.length
    ? { x: currentSource.x / strongPoints.length, y: currentSource.y / strongPoints.length }
    : { x: dataset.width / 2, y: dataset.height / 2 }

  const weakPoints = points
    .filter((point) => point.value <= threshold + 3)
    .map((point) => ({ ...point, weakness: Math.max(1, threshold - point.value + 6) }))

  if (weakPoints.length === 0) {
    return {
      x: Number((dataset.width / 2).toFixed(2)),
      y: Number((dataset.height / 2).toFixed(2)),
      rationale: "Signal is already balanced, so a centered ceiling mount is the safest placement.",
      label: "Router/AP estimate",
      mathSummary: "No strong weak-signal cluster was found, so the estimate falls back to the room center.",
    }
  }

  const center = { x: dataset.width / 2, y: dataset.height / 2 }
  const weightedWeak = weakPoints.reduce(
    (acc, point) => ({
      x: acc.x + point.x * point.weakness,
      y: acc.y + point.y * point.weakness,
      total: acc.total + point.weakness,
    }),
    { x: 0, y: 0, total: 0 }
  )
  const weakCentroid =
    weightedWeak.total > 0
      ? { x: weightedWeak.x / weightedWeak.total, y: weightedWeak.y / weightedWeak.total }
      : center

  const largestDeadzone = deadzones[0]?.centroid ?? weakCentroid
  let candidateX = weakCentroid.x * 0.55 + largestDeadzone.x * 0.25 + center.x * 0.2
  let candidateY = weakCentroid.y * 0.55 + largestDeadzone.y * 0.25 + center.y * 0.2

  const repelX = candidateX - sourceCentroid.x
  const repelY = candidateY - sourceCentroid.y
  const repelDistance = Math.sqrt(repelX * repelX + repelY * repelY)
  if (repelDistance < 1.8) {
    const push = (1.8 - repelDistance) / 1.8
    candidateX += (repelDistance > 0 ? repelX / (repelDistance || 1) : 1) * push * 1.2
    candidateY += (repelDistance > 0 ? repelY / (repelDistance || 1) : 0) * push * 1.2
  }

  const wallMargin = Math.min(0.9, Math.max(0.55, Math.min(dataset.width, dataset.height) * 0.08))
  candidateX = Math.min(Math.max(candidateX, wallMargin), dataset.width - wallMargin)
  candidateY = Math.min(Math.max(candidateY, wallMargin), dataset.height - wallMargin)

  const rationale = deadzones[0]
    ? `This point sits between the weighted center of the weak Wi-Fi samples and the largest weak-coverage zone, then gets nudged off the walls and away from the strongest existing source area.`
    : "This point balances the weak-signal centroid with the room center and keeps some wall clearance."

  return {
    x: Number(candidateX.toFixed(2)),
    y: Number(candidateY.toFixed(2)),
    rationale,
    label: "Router/AP estimate",
    mathSummary:
      "Math: weighted weak-signal centroid + largest deadzone centroid + center bias, then clamp away from walls and push away from the strongest existing Wi-Fi cluster.",
  }
}

function estimateExistingRouterPosition(
  dataset: RoomHeatmap,
  signal: SignalType,
  values: number[]
): RouterEstimate | null {
  if (signal !== "wifi") return null
  if (values.length < 3) return null

  const points = dataset.points
    .map((point) => {
      const value = getSignalValue(point, signal)
      return typeof value === "number" ? { x: point.x, y: point.y, value } : null
    })
    .filter((point): point is { x: number; y: number; value: number } => point !== null)

  if (points.length < 3) return null

  const maxValue = Math.max(...values)
  const cutoff = Math.max(maxValue - 8, values.sort((a, b) => b - a)[Math.max(0, Math.floor(values.length * 0.15) - 1)] ?? maxValue)
  const strongPoints = points.filter((point) => point.value >= cutoff)
  if (strongPoints.length < 2) return null

  const centroid = strongPoints.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  )
  const existingX = centroid.x / strongPoints.length
  const existingY = centroid.y / strongPoints.length
  const margin = Math.min(0.8, Math.max(0.4, Math.min(dataset.width, dataset.height) * 0.06))

  return {
    x: Number(Math.min(Math.max(existingX, margin), dataset.width - margin).toFixed(2)),
    y: Number(Math.min(Math.max(existingY, margin), dataset.height - margin).toFixed(2)),
    rationale: "Detected from the strongest Wi-Fi sample cluster as the likely existing access point location.",
    label: "Existing Wi-Fi AP",
    mathSummary:
      "Math: centroid of the top Wi-Fi samples within the strongest 8 dB band, clamped to stay inside the room footprint.",
  }
}

export function analyzeSignalDataset(
  dataset: RoomHeatmap | null,
  signal: SignalType
): SignalAnalysis | null {
  if (!dataset) return null

  const values = dataset.points
    .map((point) => getSignalValue(point, signal))
    .filter((value): value is number => typeof value === "number")

  if (values.length === 0) return null

  const threshold = signalThresholds[signal]
  const preparedPoints = dataset.points
    .map((point) => {
      const value = getSignalValue(point, signal)
      return typeof value === "number" ? { x: point.x, y: point.y, wifiRssi: value } : null
    })
    .filter((point): point is { x: number; y: number; wifiRssi: number } => point !== null)

  const { grid, mask, resolution } = generateHeatmapGrid(
    preparedPoints,
    dataset.width,
    dataset.height,
    getAdaptiveResolution(dataset),
    dataset.validAreas
  )

  const deadzones = buildDeadzones(grid, mask, resolution, threshold)

  return {
    signal,
    average: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)),
    best: Number(Math.max(...values).toFixed(1)),
    worst: Number(Math.min(...values).toFixed(1)),
    samples: values.length,
    threshold,
    deadzones,
    existingRouterEstimate: estimateExistingRouterPosition(dataset, signal, values),
    routerEstimate: estimateRouterPosition(dataset, signal, threshold, deadzones, values),
  }
}

export function getSignalLabel(signal: SignalType) {
  return signalLabels[signal]
}
