import { FloorRoom } from "@/store/useFloorPlan"

const SNAP_DISTANCE = 0.4 // meters (~25px)

export function isOverlapping(a: FloorRoom, b: FloorRoom) {
  // allow a tiny epsilon so that rooms that should butt up exactly
  // don't get treated as overlapping because of floating-point noise
  const EPS = 1e-6
  return !(
    a.x + a.widthM <= b.x + EPS ||
    a.x >= b.x + b.widthM - EPS ||
    a.y + a.heightM <= b.y + EPS ||
    a.y >= b.y + b.heightM - EPS
  )
}

// SNAP EDGES (meters!)
// tolerance is the maximum distance (in meters) from another room edge at which
// we should snap. Pass effectiveGridSize/2 for grid-based snapping, or leave
// undefined to fall back to SNAP_DISTANCE heuristic.
export function snapRoom(
  room: FloorRoom,
  others: FloorRoom[],
  tolerance: number = SNAP_DISTANCE
) {
  let newX = room.x
  let newY = room.y

  others.forEach((o) => {
    // LEFT -> RIGHT snap
    if (Math.abs(room.x - (o.x + o.widthM)) < tolerance)
      newX = o.x + o.widthM

    // RIGHT -> LEFT snap
    if (Math.abs(room.x + room.widthM - o.x) < tolerance)
      newX = o.x - room.widthM

    // TOP -> BOTTOM snap
    if (Math.abs(room.y - (o.y + o.heightM)) < tolerance)
      newY = o.y + o.heightM

    // BOTTOM -> TOP snap
    if (Math.abs(room.y + room.heightM - o.y) < tolerance)
      newY = o.y - room.heightM
  })

  return { x: newX, y: newY }
}

export function resolveCollision(room: FloorRoom, others: FloorRoom[]) {
  return !others.some((o) => isOverlapping(room, o))
}