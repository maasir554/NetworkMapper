"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { analyzeSignalDataset } from "@/lib/signalAnalysis"
import { normalizeRoomHeatmap } from "@/lib/heatmapParser"
import { useDataset } from "@/store/useDataset"
import { useFloorPlan } from "@/store/useFloorPlan"

export default function RoomInspector() {
  const { floors, currentFloorId, selectedRoomId, updateRoom, attachDataset, deleteRoom } =
    useFloorPlan((s) => ({
      floors: s.floors,
      currentFloorId: s.currentFloorId,
      selectedRoomId: s.selectedRoomId,
      updateRoom: s.updateRoom,
      attachDataset: s.attachDataset,
      deleteRoom: s.deleteRoom,
    }))
  const signal = useDataset((s) => s.signal)
  const currentFloor = floors.find((floor) => floor.id === currentFloorId)
  const rooms = currentFloor?.rooms ?? []
  const fileRef = useRef<HTMLInputElement>(null)
  const [inputUnit, setInputUnit] = useState<"m" | "ft">("m")

  const room = rooms.find((candidate) => candidate.id === selectedRoomId)
  const analysis = analyzeSignalDataset(room?.dataset ?? null, signal)

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && selectedRoomId) {
      const file = event.target.files[0]
      const text = await file.text()
      try {
        const json = JSON.parse(text)
        const normalized = normalizeRoomHeatmap(json, file.name.replace(/\.json$/i, ""))
        if (!normalized) {
          alert("Error parsing JSON file. Please make sure it's valid room heatmap format.")
          return
        }
        attachDataset(selectedRoomId, normalized)
        updateRoom(selectedRoomId, { widthM: normalized.width, heightM: normalized.height })
      } catch (error) {
        console.error("failed to parse room json", error)
        alert("Error parsing JSON file. Please make sure it's valid room heatmap format.")
      } finally {
        if (fileRef.current) fileRef.current.value = ""
      }
    }
  }

  if (!room) return <div>Select a room</div>

  const displayWidth = inputUnit === "ft" ? room.widthM * 3.28084 : room.widthM
  const displayHeight = inputUnit === "ft" ? room.heightM * 3.28084 : room.heightM

  const handleDimensionChange = (dimension: "widthM" | "heightM", value: number) => {
    const metersValue = inputUnit === "ft" ? value / 3.28084 : value
    updateRoom(room.id, { [dimension]: metersValue })
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Room Settings</h3>

      <input
        value={room.name}
        onChange={(e) => updateRoom(room.id, { name: e.target.value })}
        className="w-full border border-border bg-background p-2 rounded text-foreground"
      />

      <select
        value={inputUnit}
        onChange={(e) => setInputUnit(e.target.value as "m" | "ft")}
        className="rounded border border-border bg-background p-2 text-sm text-foreground"
      >
        <option value="m">Meters</option>
        <option value="ft">Feet</option>
      </select>

      <div className="flex flex-col gap-2">
        <input
          type="number"
          value={displayWidth.toFixed(2)}
          onChange={(e) => handleDimensionChange("widthM", Number(e.target.value))}
          disabled={!!room.dataset}
          className="w-full border border-border bg-background p-2 rounded text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={`Width (${inputUnit})`}
          step="0.1"
        />

        <input
          type="number"
          value={displayHeight.toFixed(2)}
          onChange={(e) => handleDimensionChange("heightM", Number(e.target.value))}
          disabled={!!room.dataset}
          className="w-full border border-border bg-background p-2 rounded text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={`Height (${inputUnit})`}
          step="0.1"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showTicks"
          checked={room.showTicks !== false}
          onChange={(e) => updateRoom(room.id, { showTicks: e.target.checked })}
          className="cursor-pointer"
        />
        <label htmlFor="showTicks" className="cursor-pointer text-sm">
          Show ticks on this room
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">Room dataset</label>
        <input type="file" hidden ref={fileRef} onChange={handleFile} />
        <Button
          onClick={() => fileRef.current?.click()}
          className="w-full"
          variant={room.dataset ? "default" : "outline"}
        >
          {room.dataset ? "Linked" : "Link JSON"}
        </Button>
      </div>

      {analysis && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
          <div className="font-medium">Coverage audit</div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-white/70">Average</span>
            <span>{analysis.average} dBm</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/70">Worst</span>
            <span>{analysis.worst} dBm</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/70">Deadzones</span>
            <span>{analysis.deadzones.length}</span>
          </div>
          {analysis.existingRouterEstimate && (
            <div className="mt-2 rounded-md border border-amber-400/20 bg-amber-400/10 p-2 text-amber-50">
              <div className="font-medium">Existing Wi-Fi AP detected</div>
              <div>
                {analysis.existingRouterEstimate.x}m, {analysis.existingRouterEstimate.y}m
              </div>
            </div>
          )}
          {analysis.routerEstimate && (
            <div className="mt-2 rounded-md bg-emerald-400/10 p-2 text-emerald-50">
              {analysis.routerEstimate.label}: {analysis.routerEstimate.x}m, {analysis.routerEstimate.y}m
            </div>
          )}
          {signal !== "wifi" && (
            <div className="mt-2 rounded-md bg-white/6 p-2 text-white/80">
              Router suggestions are Wi-Fi only. LTE and 5G remain visual layers only.
            </div>
          )}
        </div>
      )}

      <Button
        variant="destructive"
        className="mt-2 w-full"
        onClick={() => {
          if (confirm("Delete this room?")) deleteRoom(room.id)
        }}
      >
        Delete Room
      </Button>
    </div>
  )
}
