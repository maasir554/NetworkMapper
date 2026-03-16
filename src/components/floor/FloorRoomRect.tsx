"use client"

import { useRef } from "react"
import { useFloorPlan, FloorRoom } from "@/store/useFloorPlan"
import { snapRoom, resolveCollision } from "@/lib/floorMath"
import RoomHeatmapOverlay from "./RoomHeatmapOverlay"

type Props = {
  room: FloorRoom
}

export default function FloorRoomRect({ room }: Props) {
  const { floors, currentFloorId, updateRoom, scale, selectRoom, toggleRoomSelection, selectedRoomId, selectedRoomIds, snapUnit } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
    updateRoom: s.updateRoom,
    scale: s.scale,
    selectRoom: s.selectRoom,
    toggleRoomSelection: s.toggleRoomSelection,
    selectedRoomId: s.selectedRoomId,
    selectedRoomIds: s.selectedRoomIds,
    snapUnit: s.snapUnit,
  }))
  const currentFloor = floors.find((f) => f.id === currentFloorId)
  const rooms = currentFloor?.rooms ?? []
  const ref = useRef<HTMLDivElement>(null)

  // Calculate effective grid size based on snapUnit
  const effectiveGridSize = snapUnit === "meters" ? 1 : 0.3048  // 1m or 1 foot

  const others = rooms.filter((r) => r.id !== room.id)
  // Check if this room is selected (primary or in multi-select list)
  const isSelected = selectedRoomIds.includes(room.id)

  const snapToGrid = (value: number, gridSize: number) => {
    if (gridSize <= 0) return value
    // add small epsilon before rounding to avoid floating-point gaps
    const eps = 1e-6
    return Math.round((value + eps) / gridSize) * gridSize
  }

  // -------- MOVE ROOM --------
  const startDrag = (e: React.MouseEvent) => {
    e.stopPropagation()  // Prevent panning while dragging room
    // Don't change selection here - let onClick handle it
    // This preserves multi-select when dragging

    const startX = e.clientX
    const startY = e.clientY
    const startPos = { x: room.x, y: room.y }

    const move = (ev: MouseEvent) => {
      let dx = (ev.clientX - startX) / scale
      let dy = (ev.clientY - startY) / scale

      let newX = startPos.x + dx
      let newY = startPos.y + dy

      // snap to grid only (no room snapping - too restrictive)
      if (effectiveGridSize > 0) {
        newX = snapToGrid(newX, effectiveGridSize)
        newY = snapToGrid(newY, effectiveGridSize)
      }

      const newRoom = { ...room, x: newX, y: newY }

      // Check collision - allow move if no collision
      if (resolveCollision(newRoom, others)) {
        updateRoom(room.id, { x: newRoom.x, y: newRoom.y })
      }
    }

    const stop = () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", stop)
    }

    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", stop)
  }

  // -------- RESIZE ROOM --------
  const startResize = (e: React.MouseEvent) => {
    // prevent resize if room has a linked dataset
    if (room.dataset) {
      e.stopPropagation()
      return
    }

    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startW = room.widthM
    const startH = room.heightM

    const move = (ev: MouseEvent) => {
      let dw = (ev.clientX - startX) / scale
      let dh = (ev.clientY - startY) / scale

      let newW = Math.max(0.2, startW + dw)
      let newH = Math.max(0.2, startH + dh)

      // snap to grid
      if (effectiveGridSize > 0) {
        newW = snapToGrid(newW, effectiveGridSize)
        newH = snapToGrid(newH, effectiveGridSize)
      }

      const newRoom = {
        ...room,
        widthM: newW,
        heightM: newH,
      }

      if (resolveCollision(newRoom, others)) {
        updateRoom(room.id, {
          widthM: newRoom.widthM,
          heightM: newRoom.heightM,
        })
      }
    }

    const stop = () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", stop)
    }

    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", stop)
  }

  return (
    <div
      ref={ref}
      onMouseDown={startDrag}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        // Ctrl+Click for multi-select, regular click for single select
        toggleRoomSelection(room.id, e.ctrlKey || e.metaKey)
      }}
      className={`absolute border cursor-move flex flex-col
      ${isSelected ? "border-green-400 bg-green-400/20" : "border-blue-400 bg-blue-400/20"}`}
      style={{
        left: room.x * scale,
        top: room.y * scale,
        width: room.widthM * scale,
        height: room.heightM * scale,
      }}
    >
      {/* Show ticks if enabled (default true) */}
      {room.showTicks !== false && (
        <>
      {/* Top edge ticks (horizontal meter/foot marks with SVG) */}
      <svg
        className="absolute -top-6 left-0 pointer-events-none"
        width={room.widthM * scale}
        height="20"
        style={{ overflow: "visible" }}
      >
        {Array.from({ length: Math.ceil(room.widthM) + 1 }).map((_, meterIdx) => {
          // Draw ticks for each meter
          const meterPos = meterIdx * 1  // meters
          if (meterPos > room.widthM) return null
          const xPos = (meterPos / room.widthM) * (room.widthM * scale)
          
          return (
            <g key={`meter-${meterIdx}`}>
              {/* Meter mark (bright) */}
              <line
                x1={xPos}
                y1="2"
                x2={xPos}
                y2="16"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
              />
              <text
                x={xPos}
                y="1"
                fontSize="10"
                fill="rgba(255,255,255,0.7)"
                textAnchor="middle"
                dominantBaseline="text-after-edge"
              >
                {meterIdx}m
              </text>
              
              {/* Minor ticks for feet (0.3048m) between meters */}
              {meterIdx < Math.ceil(room.widthM) && Array.from({ length: 3 }).map((_, footIdx) => {
                const footOffset = (footIdx + 1) * 0.3048  // 1, 2, 3 feet
                const footPos = meterPos + footOffset
                if (footPos > room.widthM) return null
                const footXPos = (footPos / room.widthM) * (room.widthM * scale)
                return (
                  <line
                    key={`foot-h-${meterIdx}-${footIdx}`}
                    x1={footXPos}
                    y1="8"
                    x2={footXPos}
                    y2="16"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                  />
                )
              })}
            </g>
          )
        })}
      </svg>

      {/* Left edge ticks (vertical meter/foot marks with SVG) */}
      <svg
        className="absolute -left-12 top-0 pointer-events-none"
        width="40"
        height={room.heightM * scale}
        style={{ overflow: "visible" }}
      >
        {Array.from({ length: Math.ceil(room.heightM) + 1 }).map((_, meterIdx) => {
          // Draw ticks for each meter
          const meterPos = meterIdx * 1  // meters
          if (meterPos > room.heightM) return null
          const yPos = (meterPos / room.heightM) * (room.heightM * scale)
          
          return (
            <g key={`meter-v-${meterIdx}`}>
              {/* Meter mark (bright) */}
              <line
                x1="28"
                y1={yPos}
                x2="40"
                y2={yPos}
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
              />
              <text
                x="24"
                y={yPos}
                fontSize="10"
                fill="rgba(255,255,255,0.7)"
                textAnchor="end"
                dominantBaseline="central"
              >
                {meterIdx}m
              </text>
              
              {/* Minor ticks for feet (0.3048m) between meters */}
              {meterIdx < Math.ceil(room.heightM) && Array.from({ length: 3 }).map((_, footIdx) => {
                const footOffset = (footIdx + 1) * 0.3048  // 1, 2, 3 feet
                const footPos = meterPos + footOffset
                if (footPos > room.heightM) return null
                const footYPos = (footPos / room.heightM) * (room.heightM * scale)
                return (
                  <line
                    key={`foot-v-${meterIdx}-${footIdx}`}
                    x1="34"
                    y1={footYPos}
                    x2="40"
                    y2={footYPos}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                  />
                )
              })}
            </g>
          )
        })}
      </svg>
        </>
      )}

      {/* Heatmap overlay */}
      {room.dataset && (
        <RoomHeatmapOverlay
          dataset={room.dataset}
          widthM={room.widthM}
          heightM={room.heightM}
          scale={scale}
        />
      )}

      {/* ROOM LABEL - show both meters and feet */}
      <div className="absolute top-1 left-1 text-xs bg-black/70 px-1 pointer-events-none">
        <div>{room.name}</div>
        <div className="text-xs text-gray-300">
          {room.widthM.toFixed(1)}m × {room.heightM.toFixed(1)}m / {(room.widthM * 3.28084).toFixed(1)}ft × {(room.heightM * 3.28084).toFixed(1)}ft
        </div>
      </div>

      {/* RESIZE HANDLE - disabled if room has dataset */}
      {!room.dataset && (
        <div
          onMouseDown={startResize}
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-400 cursor-se-resize"
        />
      )}
    </div>
  )
}
