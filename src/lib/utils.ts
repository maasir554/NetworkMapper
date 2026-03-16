import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FloorRoom } from "@/store/useFloorPlan"
import { RoomHeatmap, SignalPoint } from "@/types/heatmap"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Merge datasets attached to multiple rooms into a single RoomHeatmap.
 * Coordinates from each room are offset by the room's (x,y) position on
 * the floor plan, then the resulting dataset is translated so its
 * minimum x/y sits at the origin.
 *
 * Useful for the 3D viewer when stitching multiple rooms together.
 */
export function mergeRoomHeatmaps(rooms: FloorRoom[]): RoomHeatmap | null {
  let points: SignalPoint[] = []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  rooms.forEach((room) => {
    if (!room.dataset) return
    room.dataset.points.forEach((p) => {
      const gx = p.x + room.x
      const gy = p.y + room.y
      points.push({ ...p, x: gx, y: gy })
      minX = Math.min(minX, gx)
      minY = Math.min(minY, gy)
      maxX = Math.max(maxX, gx)
      maxY = Math.max(maxY, gy)
    })
  })

  if (points.length === 0) {
    return null
  }

  const shiftX = minX
  const shiftY = minY
  const normalized = points.map((p) => ({
    ...p,
    x: p.x - shiftX,
    y: p.y - shiftY,
  }))

  // compute validAreas by translating each room rectangle
  const validAreas = rooms
    .filter((r) => r.dataset)
    .map((r) => ({
      x: r.x - shiftX,
      y: r.y - shiftY,
      width: r.widthM,
      height: r.heightM,
    }))

  return {
    roomName: "Combined",
    width: maxX - minX,
    height: maxY - minY,
    points: normalized,
    validAreas,
  }
}
