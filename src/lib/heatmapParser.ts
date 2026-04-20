import { RoomHeatmap, SignalPoint } from "@/types/heatmap"

type RawSignalPoint = Record<string, unknown>

type RawRoomHeatmap = Record<string, unknown>

function parsePoint(raw: RawSignalPoint): SignalPoint | null {
  const x = typeof raw.x === "number" ? raw.x : Number(raw.x)
  const y = typeof raw.y === "number" ? raw.y : Number(raw.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null

  const wifiRssi = typeof raw.wifiRssi === "number" ? raw.wifiRssi : typeof raw.rssi === "number" ? raw.rssi : undefined
  const lteRsrp = typeof raw.lteRsrp === "number" ? raw.lteRsrp : typeof raw.rsrp === "number" ? raw.rsrp : undefined
  const nrRsrp = typeof raw.nrRsrp === "number" ? raw.nrRsrp : undefined

  if (wifiRssi === undefined && lteRsrp === undefined && nrRsrp === undefined) return null

  return {
    x,
    y,
    ...(wifiRssi !== undefined ? { wifiRssi } : {}),
    ...(lteRsrp !== undefined ? { lteRsrp } : {}),
    ...(nrRsrp !== undefined ? { nrRsrp } : {}),
  }
}

function parseArrayPoints(value: unknown): SignalPoint[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "object" && item !== null ? parsePoint(item as RawSignalPoint) : null))
    .filter((point): point is SignalPoint => point !== null)
}

function parseSignalsAsPoints(signals: unknown): SignalPoint[] {
  if (typeof signals !== "object" || signals === null) return []

  const wifiPoints = Array.isArray((signals as any).wifi) ? (signals as any).wifi : []
  const ltePoints = Array.isArray((signals as any).lte) ? (signals as any).lte : []
  const nrPoints = Array.isArray((signals as any).nr) ? (signals as any).nr : []

  const pointIndex = new Map<string, SignalPoint>()

  ;[...wifiPoints, ...ltePoints, ...nrPoints].forEach((rawPoint) => {
    if (typeof rawPoint !== "object" || rawPoint === null) return
    const x = typeof (rawPoint as any).x === "number" ? (rawPoint as any).x : Number((rawPoint as any).x)
    const y = typeof (rawPoint as any).y === "number" ? (rawPoint as any).y : Number((rawPoint as any).y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return

    const key = `${x}-${y}`
    const existing = (pointIndex.get(key) ?? { x, y }) as SignalPoint
    const wifiRssi = typeof (rawPoint as any).wifiRssi === "number" ? (rawPoint as any).wifiRssi : typeof (rawPoint as any).rssi === "number" ? (rawPoint as any).rssi : existing.wifiRssi
    const lteRsrp = typeof (rawPoint as any).lteRsrp === "number" ? (rawPoint as any).lteRsrp : typeof (rawPoint as any).rsrp === "number" ? (rawPoint as any).rsrp : existing.lteRsrp
    const nrRsrp = typeof (rawPoint as any).nrRsrp === "number" ? (rawPoint as any).nrRsrp : existing.nrRsrp

    pointIndex.set(key, {
      x,
      y,
      ...(wifiRssi !== undefined ? { wifiRssi } : {}),
      ...(lteRsrp !== undefined ? { lteRsrp } : {}),
      ...(nrRsrp !== undefined ? { nrRsrp } : {}),
    })
  })

  return Array.from(pointIndex.values())
}

export function normalizeRoomHeatmap(raw: unknown, fallbackName?: string): RoomHeatmap | null {
  if (typeof raw !== "object" || raw === null) return null

  const roomName =
    typeof (raw as any).roomName === "string"
      ? (raw as any).roomName
      : typeof (raw as any).name === "string"
      ? (raw as any).name
      : fallbackName ?? "Room"

  const width =
    typeof (raw as any).width === "number"
      ? (raw as any).width
      : typeof (raw as any).widthM === "number"
      ? (raw as any).widthM
      : undefined

  const height =
    typeof (raw as any).height === "number"
      ? (raw as any).height
      : typeof (raw as any).heightM === "number"
      ? (raw as any).heightM
      : undefined

  if (typeof width !== "number" || typeof height !== "number") return null

  let points: SignalPoint[] = []

  if (Array.isArray((raw as any).points)) {
    points = parseArrayPoints((raw as any).points)
  }

  if (points.length === 0 && (raw as any).signals) {
    points = parseSignalsAsPoints((raw as any).signals)
  }

  if (points.length === 0) return null

  return {
    roomName,
    width,
    height,
    points,
  }
}
