import { analyzeSignalDataset } from "@/lib/signalAnalysis"
import { mergeRoomHeatmaps } from "@/lib/utils"
import { FloorRoom } from "@/store/useFloorPlan"
import { SignalType } from "@/store/useDataset"
import { RoomHeatmap } from "@/types/heatmap"

export type RouterMarker = {
  id: string
  x: number
  y: number
  scope: "room" | "floor"
  roomName?: string
  kind?: "existing" | "suggested"
  label?: string
}

export function buildFloorDataset(rooms: FloorRoom[]): RoomHeatmap | null {
  return mergeRoomHeatmaps(rooms)
}

export function buildRouterMarkersForDataset(
  dataset: RoomHeatmap,
  signal: SignalType,
  scope: "room" | "floor",
  roomName?: string
) {
  if (signal !== "wifi") return [] as RouterMarker[]

  const analysis = analyzeSignalDataset(dataset, signal)
  if (!analysis) return []

  const markers: RouterMarker[] = []

  if (analysis.existingRouterEstimate) {
    markers.push({
      id: `${scope}-${roomName ?? dataset.roomName}-existing`,
      x: analysis.existingRouterEstimate.x,
      y: analysis.existingRouterEstimate.y,
      scope,
      roomName,
      kind: "existing",
      label: "Existing AP",
    })
  }

  if (analysis.routerEstimate) {
    markers.push({
      id: `${scope}-${roomName ?? dataset.roomName}-suggested`,
      x: analysis.routerEstimate.x,
      y: analysis.routerEstimate.y,
      scope,
      roomName,
      kind: "suggested",
      label: "Suggested AP",
    })
  }

  return markers
}

export function buildWholeFloorRouterMarkers(rooms: FloorRoom[], signal: SignalType) {
  const dataset = mergeRoomHeatmaps(rooms)
  if (!dataset) return { dataset: null, markers: [] as RouterMarker[] }

  const analysis = analyzeSignalDataset(dataset, signal)
  if (!analysis) return { dataset, markers: [] }

  const markers: RouterMarker[] = []

  if (analysis.existingRouterEstimate) {
    markers.push({
      id: "floor-existing",
      x: analysis.existingRouterEstimate.x,
      y: analysis.existingRouterEstimate.y,
      scope: "floor",
      kind: "existing",
      label: "Existing AP",
    })
  }

  if (analysis.routerEstimate) {
    markers.push({
      id: "floor-suggested-main",
      x: analysis.routerEstimate.x,
      y: analysis.routerEstimate.y,
      scope: "floor",
      kind: "suggested",
      label: "Suggested AP (Primary)",
    })
  }

  // Suggest additional routers for all deadzones beyond the primary one
  if (analysis.deadzones.length > 1) {
    analysis.deadzones.slice(1).forEach((zone, index) => {
      markers.push({
        id: `floor-suggested-zone-${index + 1}`,
        x: zone.centroid.x,
        y: zone.centroid.y,
        scope: "floor",
        kind: "suggested",
        label: `Suggested AP (Deadzone ${index + 1})`,
      })
    })
  }

  return { dataset, markers }
}
