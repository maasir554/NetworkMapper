"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { SignalType, useDataset } from "@/store/useDataset"
import { useFloorPlan } from "@/store/useFloorPlan"
import { FloorRoom } from "@/store/useFloorPlan"

type LegacySignalPoint = { x: number; y: number; rssi?: number; rsrp?: number }
type ImportedRoom = {
  id: string
  name: string
  x: number
  y: number
  widthM: number
  heightM: number
  showTicks?: boolean
  dataset?: FloorRoom["dataset"] | null
  signals?: {
    wifi?: LegacySignalPoint[]
    lte?: LegacySignalPoint[]
    nr?: LegacySignalPoint[]
  }
}

export default function FloorToolbar() {
  const {
    floors,
    currentFloorId,
    setRooms,
    addFloor,
    setCurrentFloor,
    deleteFloor,
    snapUnit,
    setSnapUnit,
  } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
    setRooms: s.setRooms,
    addFloor: s.addFloor,
    setCurrentFloor: s.setCurrentFloor,
    deleteFloor: s.deleteFloor,
    snapUnit: s.snapUnit,
    setSnapUnit: s.setSnapUnit,
  }))
  const currentFloor = floors.find((floor) => floor.id === currentFloorId)
  const rooms = currentFloor?.rooms ?? []

  const scale = useFloorPlan((s) => s.scale)
  const setScale = useFloorPlan((s) => s.setScale)
  const setOffset = useFloorPlan((s) => s.setOffset)
  const signal = useDataset((s) => s.signal)
  const setSignal = useDataset((s) => s.setSignal)

  const fileRef = useRef<HTMLInputElement>(null)

  const exportFloor = () => {
    if (!currentFloor) return

    const roomsWithSignals = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      x: room.x,
      y: room.y,
      widthM: room.widthM,
      heightM: room.heightM,
      showTicks: room.showTicks ?? true,
      dataset: room.dataset ?? null,
      signals: room.dataset
        ? {
            wifi: room.dataset.points
              .filter((point) => point.wifiRssi !== undefined)
              .map((point) => ({ x: point.x, y: point.y, rssi: point.wifiRssi })),
            lte: room.dataset.points
              .filter((point) => point.lteRsrp !== undefined)
              .map((point) => ({ x: point.x, y: point.y, rsrp: point.lteRsrp })),
            nr: room.dataset.points
              .filter((point) => point.nrRsrp !== undefined)
              .map((point) => ({ x: point.x, y: point.y, rsrp: point.nrRsrp })),
          }
        : { wifi: [], lte: [], nr: [] },
    }))

    const blob = new Blob(
      [JSON.stringify({ floorName: currentFloor.name, rooms: roomsWithSignals }, null, 2)],
      { type: "application/json" }
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${currentFloor.name || "floor"}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const text = await event.target.files[0].text()
      try {
        const json = JSON.parse(text)
        if (json.rooms && Array.isArray(json.rooms)) {
          const normalizedRooms: FloorRoom[] = (json.rooms as ImportedRoom[]).map((room) => {
            if (room.dataset?.points) {
              return {
                id: room.id,
                name: room.name,
                x: room.x,
                y: room.y,
                widthM: room.widthM,
                heightM: room.heightM,
                showTicks: room.showTicks,
                dataset: room.dataset,
              }
            }

            const wifiPoints = room.signals?.wifi ?? []
            const ltePoints = room.signals?.lte ?? []
            const nrPoints = room.signals?.nr ?? []
            const pointMap = new Map<string, { x: number; y: number; wifiRssi?: number; lteRsrp?: number; nrRsrp?: number }>()

            wifiPoints.forEach((point) => {
              pointMap.set(`${point.x}-${point.y}`, {
                ...(pointMap.get(`${point.x}-${point.y}`) ?? { x: point.x, y: point.y }),
                wifiRssi: point.rssi,
              })
            })

            ltePoints.forEach((point) => {
              pointMap.set(`${point.x}-${point.y}`, {
                ...(pointMap.get(`${point.x}-${point.y}`) ?? { x: point.x, y: point.y }),
                lteRsrp: point.rsrp,
              })
            })

            nrPoints.forEach((point) => {
              pointMap.set(`${point.x}-${point.y}`, {
                ...(pointMap.get(`${point.x}-${point.y}`) ?? { x: point.x, y: point.y }),
                nrRsrp: point.rsrp,
              })
            })

            const dataset =
              pointMap.size > 0
                ? {
                    roomName: room.name,
                    width: room.widthM,
                    height: room.heightM,
                    points: Array.from(pointMap.values()),
                  }
                : undefined

            return {
              id: room.id,
              name: room.name,
              x: room.x,
              y: room.y,
              widthM: room.widthM,
              heightM: room.heightM,
              showTicks: room.showTicks,
              dataset,
            }
          })
          setRooms(normalizedRooms)
        }
      } catch (error) {
        console.error("failed to parse floor json", error)
      }
    }
    event.target.value = ""
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 bg-[#0b1624] p-3">
      <span className="font-semibold">Floor:</span>
      <select
        value={currentFloorId || ""}
        onChange={(e) => setCurrentFloor(e.target.value)}
        className="rounded bg-neutral-900 p-1"
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
      <Button onClick={() => setScale(scale / 1.2)}>-</Button>
      <span className="w-12 text-center">{(scale / 60).toFixed(2)}x</span>
      <Button onClick={() => setScale(scale * 1.2)}>+</Button>
      <Button
        onClick={() => {
          setScale(60)
          setOffset(0, 0)
        }}
      >
        Reset
      </Button>
      <Button
        onClick={() => {
          if (rooms.length === 0) return
          let minX = Infinity
          let minY = Infinity
          let maxX = -Infinity
          let maxY = -Infinity

          rooms.forEach((room) => {
            minX = Math.min(minX, room.x)
            minY = Math.min(minY, room.y)
            maxX = Math.max(maxX, room.x + room.widthM)
            maxY = Math.max(maxY, room.y + room.heightM)
          })

          const cx = (minX + maxX) / 2
          const cy = (minY + maxY) / 2
          setOffset(window.innerWidth / 2 / scale - cx, window.innerHeight / 2 / scale - cy)
        }}
      >
        Center
      </Button>

      <span className="font-semibold">Signal:</span>
      <select
        value={signal}
        onChange={(e) => setSignal(e.target.value as SignalType)}
        className="rounded bg-neutral-900 p-1"
      >
        <option value="wifi">WiFi</option>
        <option value="lte">LTE</option>
        <option value="nr">5G</option>
      </select>

      <span className="font-semibold">Grid:</span>
      <select
        value={snapUnit}
        onChange={(e) => setSnapUnit(e.target.value as "feet" | "meters")}
        className="rounded bg-neutral-900 p-1"
      >
        <option value="feet">Feet</option>
        <option value="meters">Meters</option>
      </select>
    </div>
  )
}
