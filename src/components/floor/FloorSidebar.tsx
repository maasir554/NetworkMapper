"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SquareCard } from "@/components/ui/square-card"
import { buildWholeFloorRouterMarkers } from "@/lib/routerPlanning"
import { useFloorPlan } from "@/store/useFloorPlan"
import RoomInspector from "./RoomInspector"

export default function FloorSidebar() {
  const { addRoom } = useFloorPlan()
  const router = useRouter()
  const selectedRoomIds = useFloorPlan((s) => s.selectedRoomIds)
  const floors = useFloorPlan((s) => s.floors)
  const currentFloorId = useFloorPlan((s) => s.currentFloorId)
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState(4)
  const [height, setHeight] = useState(3)

  const currentFloor = floors.find((floor) => floor.id === currentFloorId)
  const rooms = useMemo(() => currentFloor?.rooms ?? [], [currentFloor])
  const wholeFloorPlan = useMemo(() => buildWholeFloorRouterMarkers(rooms, "wifi"), [rooms])

  return (
    <div className={`${collapsed ? "w-[72px]" : "w-[340px]"} flex shrink-0 flex-col border-r border-white/10 bg-[#09131f] transition-[width]`}>
      <div className="flex items-center justify-between border-b border-white/10 p-3">
        {!collapsed && <h2 className="text-lg font-bold">Floor Planner</h2>}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70"
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <p className="text-sm text-white/60">
            Lay out rooms on a snapping grid, attach measured JSONs, then open combined coverage in the 3D viewer.
          </p>

          <Button
            disabled={selectedRoomIds.length === 0}
            onClick={() => router.push(`/viewer?rooms=${selectedRoomIds.join(",")}`)}
          >
            Open in 3D View ({selectedRoomIds.length} selected)
          </Button>

          <SquareCard className="space-y-3 p-4">
            <div>
              <div className="font-semibold">Router planning</div>
              <div className="text-xs text-white/55">
                Whole-floor router suggestions for the current floor.
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {wholeFloorPlan.markers.length > 0 ? (
                wholeFloorPlan.markers.map((marker) => (
                  <div key={marker.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span>{marker.roomName ?? marker.label ?? "Floor router"}</span>
                    <span className="text-emerald-100">
                      {marker.x.toFixed(1)}m, {marker.y.toFixed(1)}m
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-white/5 px-3 py-2 text-white/60">
                  Link Wi-Fi room datasets to generate whole-floor router suggestions.
                </div>
              )}
            </div>
          </SquareCard>

          <SquareCard className="p-4">
            <div className="space-y-2">
              <span className="font-semibold">New room size (meters)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-16 rounded bg-neutral-900 p-1"
                />
                <span>x</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-16 rounded bg-neutral-900 p-1"
                />
              </div>
              <Button onClick={() => addRoom(width, height)} className="w-full">
                Add Room
              </Button>
            </div>
          </SquareCard>

          <SquareCard className="p-4">
            <RoomInspector />
          </SquareCard>
        </div>
      )}
    </div>
  )
}
