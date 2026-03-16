"use client"

import { useFloorPlan } from "@/store/useFloorPlan"
import RoomInspector from "./RoomInspector"
import { SquareCard } from "@/components/ui/square-card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function FloorSidebar() {
  const { addRoom } = useFloorPlan()
  const router = useRouter()
  const selectedRoomIds = useFloorPlan((s) => s.selectedRoomIds)
  const [w, setW] = useState(4)
  const [h, setH] = useState(3)

  return (
    <div className="w-[320px] border-r border-white/10 p-4 space-y-4">

      <h2 className="text-xl font-bold">Floor Planner</h2>

      <Button
        disabled={selectedRoomIds.length === 0}
        onClick={() => {
          const ids = selectedRoomIds.join(",")
          router.push(`/viewer?rooms=${ids}`)
        }}
      >
        Open in 3D View ({selectedRoomIds.length} selected)
      </Button>

      {/* new-room size + add button */}
      <SquareCard className="p-4">
        <div className="space-y-2">
          <span className="font-semibold">New room size (meters)</span>
          <div className="flex gap-2">
            <input
              type="number"
              value={w}
              onChange={(e) => setW(Number(e.target.value))}
              className="w-16 bg-neutral-900 p-1 rounded"
            />
            x
            <input
              type="number"
              value={h}
              onChange={(e) => setH(Number(e.target.value))}
              className="w-16 bg-neutral-900 p-1 rounded"
            />
          </div>
          <Button onClick={() => addRoom(w, h)} className="w-full">
            Add Room
          </Button>
        </div>
      </SquareCard>

      <SquareCard className="p-4">
        <RoomInspector />
      </SquareCard>

    </div>
  )
}