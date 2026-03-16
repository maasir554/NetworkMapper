"use client"

import { useFloorPlan } from "@/store/useFloorPlan"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export default function RoomInspector() {
  const { floors, currentFloorId, selectedRoomId, updateRoom, attachDataset, deleteRoom } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
    selectedRoomId: s.selectedRoomId,
    updateRoom: s.updateRoom,
    attachDataset: s.attachDataset,
    deleteRoom: s.deleteRoom,
  }))
  const currentFloor = floors.find((f) => f.id === currentFloorId)
  const rooms = currentFloor?.rooms ?? []

  const fileRef = useRef<HTMLInputElement>(null)
  const [inputUnit, setInputUnit] = useState<"m" | "ft">("m")

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const text = await file.text()
      try {
        const json = JSON.parse(text)
        if (selectedRoomId) {
          attachDataset(selectedRoomId, json)
          // update room dimensions if provided by file
          if (typeof json.width === "number" && typeof json.height === "number") {
            updateRoom(selectedRoomId, {
              widthM: json.width,
              heightM: json.height,
            })
          }
        }
      } catch (err) {
        console.error("failed to parse room json", err)
        alert("Error parsing JSON file. Please make sure it\'s valid RoomHeatmap format.")
      } finally {
        // clear the value so the same file can be re-uploaded later
        if (fileRef.current) {
          fileRef.current.value = ""
        }
      }
    }
  }

  const room = rooms.find((r) => r.id === selectedRoomId)

  if (!room) return <div>Select a room</div>

  // Convert display/input values based on selected unit
  const displayWidth = inputUnit === "ft" ? room.widthM * 3.28084 : room.widthM
  const displayHeight = inputUnit === "ft" ? room.heightM * 3.28084 : room.heightM

  const handleDimensionChange = (dimension: "widthM" | "heightM", value: number) => {
    // Convert input back to meters if needed
    const metersValue = inputUnit === "ft" ? value / 3.28084 : value
    updateRoom(room.id, { [dimension]: metersValue })
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Room Settings</h3>

      <input
        value={room.name}
        onChange={(e) => updateRoom(room.id, { name: e.target.value })}
        className="w-full p-2 bg-black border"
      />

      <div className="flex gap-2">
        <select
          value={inputUnit}
          onChange={(e) => setInputUnit(e.target.value as "m" | "ft")}
          className="bg-black p-2 rounded border text-sm"
        >
          <option value="m">Meters</option>
          <option value="ft">Feet</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="number"
          value={displayWidth?.toFixed(2) || 0}
          onChange={(e) => handleDimensionChange("widthM", Number(e.target.value))}
          disabled={!!room.dataset}
          className="w-full p-2 bg-black border disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={`Width (${inputUnit})`}
          step="0.1"
        />

        <input
          type="number"
          value={displayHeight?.toFixed(2) || 0}
          onChange={(e) => handleDimensionChange("heightM", Number(e.target.value))}
          disabled={!!room.dataset}
          className="w-full p-2 bg-black border disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={`Height (${inputUnit})`}
          step="0.1"
        />
      </div>

      {/* Show/hide ticks checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showTicks"
          checked={room.showTicks !== false}
          onChange={(e) => updateRoom(room.id, { showTicks: e.target.checked })}
          className="cursor-pointer"
        />
        <label htmlFor="showTicks" className="text-sm cursor-pointer">
          Show ticks on this room
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted-foreground font-medium">Room dataset</label>
        <input type="file" hidden ref={fileRef} onChange={handleFile} />
        <Button
          onClick={() => fileRef.current?.click()}
          className="w-full"
          variant={room.dataset ? "default" : "outline"}
        >
          {room.dataset ? "✓ Linked" : "Link JSON"}
        </Button>
      </div>

      <Button
        variant="destructive"
        className="w-full mt-2"
        onClick={() => {
          if (confirm("Delete this room?")) {
            deleteRoom(room.id)
          }
        }}
      >
        Delete Room
      </Button>
    </div>
  )
}