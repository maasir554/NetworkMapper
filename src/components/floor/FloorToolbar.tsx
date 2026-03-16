"use client"

import { useFloorPlan } from "@/store/useFloorPlan"
import { useDataset } from "@/store/useDataset"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"

export default function FloorToolbar() {
  const { floors, currentFloorId, setRooms, addFloor, setCurrentFloor, deleteFloor, snapUnit, setSnapUnit } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
    setRooms: s.setRooms,
    addFloor: s.addFloor,
    setCurrentFloor: s.setCurrentFloor,
    deleteFloor: s.deleteFloor,
    snapUnit: s.snapUnit,
    setSnapUnit: s.setSnapUnit,
  }))
  const currentFloor = floors.find((f) => f.id === currentFloorId)
  const rooms = currentFloor?.rooms ?? []

  const scale = useFloorPlan((s) => s.scale)
  const setScale = useFloorPlan((s) => s.setScale)
  const setOffset = useFloorPlan((s) => s.setOffset)
  const signal = useDataset((s) => s.signal)
  const setSignal = useDataset((s) => s.setSignal)

  const fileRef = useRef<HTMLInputElement>(null)
  
  const exportFloor = () => {
    if (!currentFloor) return

    // Enhanced export with signal data per room
    const roomsWithSignals = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      x: room.x,
      y: room.y,
      widthM: room.widthM,
      heightM: room.heightM,
      signals: room.dataset
        ? {
            wifi: room.dataset.points
              .filter((p) => p.wifiRssi !== undefined)
              .map((p) => ({ x: p.x, y: p.y, rssi: p.wifiRssi })),
            lte: room.dataset.points
              .filter((p) => p.lteRsrp !== undefined)
              .map((p) => ({ x: p.x, y: p.y, rsrp: p.lteRsrp })),
            nr: room.dataset.points
              .filter((p) => p.nrRsrp !== undefined)
              .map((p) => ({ x: p.x, y: p.y, rsrp: p.nrRsrp })),
          }
        : { wifi: [], lte: [], nr: [] },
    }))

    const data = {
      floorName: currentFloor.name,
      rooms: roomsWithSignals,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentFloor.name || "floor"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const text = await e.target.files[0].text()
      try {
        const json = JSON.parse(text)
        // expect { rooms: FloorRoom[], floorName?: string }
        if (json.rooms && Array.isArray(json.rooms)) {
          setRooms(json.rooms)
        }
      } catch (err) {
        console.error("failed to parse floor json", err)
      }
    }
    // Clear the input so same file can be selected again
    e.target.value = ""
  }

  return (
    <div className="p-3 border-b border-neutral-800 flex gap-3 items-center flex-wrap">
      {/* Floor selector */}
      <span className="font-semibold">Floor:</span>
      <select
        value={currentFloorId || ""}
        onChange={(e) => setCurrentFloor(e.target.value)}
        className="bg-neutral-900 p-1 rounded"
      >
        {floors.map((floor) => (
          <option key={floor.id} value={floor.id}>
            {floor.name}
          </option>
        ))}
      </select>

      <Button
        onClick={() => {
          const name = prompt("New floor name:", `Floor ${floors.length + 1}`)
          if (name) addFloor(name)
        }}
        size="sm"
      >
        + Floor
      </Button>

      {floors.length > 1 && (
        <Button
          onClick={() => {
            if (confirm(`Delete floor "${currentFloor?.name}"?`)) {
              deleteFloor(currentFloorId || "")
            }
          }}
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      )}

      <Button onClick={() => fileRef.current?.click()}>Import JSON</Button>
      <input
        type="file"
        accept="application/json"
        hidden
        ref={fileRef}
        onChange={handleFile}
      />
      <Button onClick={exportFloor}>Export JSON</Button>

      <span className="font-semibold">Zoom:</span>
      <Button onClick={() => setScale(scale * 1.2)}>-</Button>
      <span className="w-12 text-center">{(scale / 60).toFixed(2)}x</span>
      <Button onClick={() => setScale(scale / 1.2)}>+</Button>
      <Button onClick={() => { setScale(60); setOffset(0, 0); }}>Reset</Button>
      <Button onClick={() => {
        // compute bounding box of rooms
        if (rooms.length === 0) return
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        rooms.forEach(r => {
          minX = Math.min(minX, r.x)
          minY = Math.min(minY, r.y)
          maxX = Math.max(maxX, r.x + r.widthM)
          maxY = Math.max(maxY, r.y + r.heightM)
        })
        const cx = (minX + maxX) / 2
        const cy = (minY + maxY) / 2
        const w = window.innerWidth
        const h = window.innerHeight
        setOffset((w / 2) / scale - cx, (h / 2) / scale - cy)
      }}>Center</Button>

      <span className="font-semibold">Signal:</span>
      <select
        value={signal}
        onChange={(e) => setSignal(e.target.value as any)}
        className="bg-neutral-900 p-1 rounded"
      >
        <option value="wifi">Wi‑Fi</option>
        <option value="lte">LTE</option>
        <option value="nr">5G</option>
      </select>

      <span className="font-semibold">Grid:</span>
      <select
        value={snapUnit}
        onChange={(e) => setSnapUnit(e.target.value as "feet" | "meters")}
        className="bg-neutral-900 p-1 rounded"
      >
        <option value="feet">Feet</option>
        <option value="meters">Meters</option>
      </select>
    </div>
  )
}