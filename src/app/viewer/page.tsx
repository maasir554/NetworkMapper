"use client"

export const dynamic = "force-dynamic"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import HeatmapScene from "@/components/HeatmapScene"
import { Card } from "@/components/ui/card"
import { buildWholeFloorRouterMarkers } from "@/lib/routerPlanning"
import { useFloorPlan } from "@/store/useFloorPlan"

function ViewerPageClient() {
  const search = useSearchParams()
  const idsParam = search.get("rooms")

  const { floors, currentFloorId } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
  }))
  const currentFloor = floors.find((floor) => floor.id === currentFloorId)
  const rooms = currentFloor?.rooms ?? []
  const ids = idsParam ? idsParam.split(",") : []
  const selectedRooms = rooms.filter((room) => ids.includes(room.id))
  const wholeFloorPlan = useMemo(() => buildWholeFloorRouterMarkers(selectedRooms, "wifi"), [selectedRooms])

  if (!idsParam) return <div className="h-screen flex items-center justify-center text-white">No rooms selected</div>

  if (selectedRooms.length === 0) return <div className="h-screen flex items-center justify-center text-white">No rooms found</div>

  return (
    <div className="h-screen bg-neutral-950 p-6">
      <Card className="h-full">
        <HeatmapScene
          initialSignal="wifi"
          dataset={wholeFloorPlan.dataset}
          filename={wholeFloorPlan.dataset ? `Combined rooms (${selectedRooms.length})` : "No data"}
          routerMarkers={wholeFloorPlan.markers}
        />
      </Card>
    </div>
  )
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-white">Loading viewer…</div>}>
      <ViewerPageClient />
    </Suspense>
  )
}
