"use client"

import { RouterMarker } from "@/lib/routerPlanning"
import { RoomHeatmap } from "@/types/heatmap"

export default function RouterMarkers3D({
  dataset,
  markers,
}: {
  dataset: RoomHeatmap | null
  markers: RouterMarker[]
}) {
  if (!dataset || markers.length === 0) return null

  const getColor = (marker: RouterMarker) => {
    if (marker.kind === "existing") return "#f59e0b"
    if (marker.kind === "suggested") return "#22c55e"
    return marker.scope === "floor" ? "#22c55e" : "#38bdf8"
  }

  return (
    <group position={[-dataset.width / 2, 0, -dataset.height / 2]}>
      {markers.map((marker) => (
        <group key={marker.id} position={[marker.x, 0.18, marker.y]}>
          <mesh>
            <sphereGeometry args={[0.16, 18, 18]} />
            <meshStandardMaterial color={getColor(marker)} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
