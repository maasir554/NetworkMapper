"use client"

import { useSearchParams } from "next/navigation"
import { useFloorPlan } from "@/store/useFloorPlan"
import HeatmapScene from "@/components/HeatmapScene"
import { Card } from "@/components/ui/card"
import { mergeRoomHeatmaps } from "@/lib/utils"

export default function ViewerPage() {
  const search = useSearchParams()
  const idsParam = search.get("rooms")

  const { floors, currentFloorId } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
  }))
  const currentFloor = floors.find((f) => f.id === currentFloorId)
  const rooms = currentFloor?.rooms ?? []

  if (!idsParam) return <div>No rooms selected</div>

  const ids = idsParam.split(",")
  const selectedRooms = rooms.filter((r) => ids.includes(r.id))

  if (selectedRooms.length === 0) {
    return <div>No rooms found</div>
  }

  if (selectedRooms.length === 1) {
    const room = selectedRooms[0]
    return (
      <div className="h-screen p-6 bg-neutral-950">
        <Card className="h-full">
          <HeatmapScene
            initialSignal="wifi"
            dataset={room.dataset ?? null}
            filename={room.name}
          />
        </Card>
      </div>
    )
  }

  // merge for multi-room view
  const merged = mergeRoomHeatmaps(selectedRooms)

  return (
    <div className="h-screen p-6 bg-neutral-950">
      <Card className="h-full">
        <HeatmapScene
          initialSignal="wifi"
          dataset={merged}
          filename={merged ? "Combined rooms" : "No data"}
        />
      </Card>
    </div>
  )
}