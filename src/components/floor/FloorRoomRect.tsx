"use client"

import { useMemo, useRef, useState } from "react"
import RoomHeatmapOverlay from "./RoomHeatmapOverlay"
import { analyzeSignalDataset } from "@/lib/signalAnalysis"
import { resolveCollision, snapRoom } from "@/lib/floorMath"
import { useDataset } from "@/store/useDataset"
import { FloorRoom, useFloorPlan } from "@/store/useFloorPlan"

type Props = {
  room: FloorRoom
}

type RoomDraft = {
  x: number
  y: number
  widthM: number
  heightM: number
}

export default function FloorRoomRect({ room }: Props) {
  const {
    floors,
    currentFloorId,
    updateRoom,
    scale,
    offsetX,
    offsetY,
    toggleRoomSelection,
    selectedRoomIds,
    snapUnit,
  } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
    updateRoom: s.updateRoom,
    scale: s.scale,
    offsetX: s.offsetX,
    offsetY: s.offsetY,
    toggleRoomSelection: s.toggleRoomSelection,
    selectedRoomIds: s.selectedRoomIds,
    snapUnit: s.snapUnit,
  }))
  const signal = useDataset((s) => s.signal)
  const currentFloor = floors.find((floor) => floor.id === currentFloorId)
  const rooms = useMemo(() => currentFloor?.rooms ?? [], [currentFloor])
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<RoomDraft | null>(null)
  const draftRef = useRef<RoomDraft | null>(null)

  const effectiveGridSize = snapUnit === "meters" ? 1 : 0.3048
  const others = useMemo(() => rooms.filter((candidate) => candidate.id !== room.id), [rooms, room.id])
  const isSelected = selectedRoomIds.includes(room.id)
  const analysis = useMemo(() => analyzeSignalDataset(room.dataset ?? null, signal), [room.dataset, signal])

  const draftRoom = draft
    ? { ...room, x: draft.x, y: draft.y, widthM: draft.widthM, heightM: draft.heightM }
    : room

  const snapToGrid = (value: number, gridSize: number) => {
    if (gridSize <= 0) return value
    return Math.round((value + 1e-6) / gridSize) * gridSize
  }

  const startDrag = (event: React.MouseEvent) => {
    event.stopPropagation()

    const startX = event.clientX
    const startY = event.clientY
    const startPos = { x: room.x, y: room.y }

    const move = (nextEvent: MouseEvent) => {
      let nextX = startPos.x + (nextEvent.clientX - startX) / scale
      let nextY = startPos.y + (nextEvent.clientY - startY) / scale

      if (effectiveGridSize > 0) {
        nextX = snapToGrid(nextX, effectiveGridSize)
        nextY = snapToGrid(nextY, effectiveGridSize)
      }

      const snapped = snapRoom({ ...room, x: nextX, y: nextY }, others, effectiveGridSize / 2)
      const candidate = { ...room, x: snapped.x, y: snapped.y }

      if (resolveCollision(candidate, others)) {
        const nextDraft = {
          x: candidate.x,
          y: candidate.y,
          widthM: room.widthM,
          heightM: room.heightM,
        }
        draftRef.current = nextDraft
        setDraft(nextDraft)
      }
    }

    const stop = () => {
      const finalDraft = draftRef.current
      if (finalDraft) {
        updateRoom(room.id, { x: finalDraft.x, y: finalDraft.y })
      }
      draftRef.current = null
      setDraft(null)
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", stop)
    }

    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", stop)
  }

  const startResize = (event: React.MouseEvent) => {
    if (room.dataset) {
      event.stopPropagation()
      return
    }

    event.stopPropagation()
    const startX = event.clientX
    const startY = event.clientY
    const startWidth = room.widthM
    const startHeight = room.heightM

    const move = (nextEvent: MouseEvent) => {
      let nextWidth = Math.max(0.2, startWidth + (nextEvent.clientX - startX) / scale)
      let nextHeight = Math.max(0.2, startHeight + (nextEvent.clientY - startY) / scale)

      if (effectiveGridSize > 0) {
        nextWidth = snapToGrid(nextWidth, effectiveGridSize)
        nextHeight = snapToGrid(nextHeight, effectiveGridSize)
      }

      const candidate = { ...room, widthM: nextWidth, heightM: nextHeight }
      if (resolveCollision(candidate, others)) {
        const nextDraft = {
          x: room.x,
          y: room.y,
          widthM: candidate.widthM,
          heightM: candidate.heightM,
        }
        draftRef.current = nextDraft
        setDraft(nextDraft)
      }
    }

    const stop = () => {
      const finalDraft = draftRef.current
      if (finalDraft) {
        updateRoom(room.id, { widthM: finalDraft.widthM, heightM: finalDraft.heightM })
      }
      draftRef.current = null
      setDraft(null)
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
      onClick={(event) => {
        event.stopPropagation()
        toggleRoomSelection(room.id, event.ctrlKey || event.metaKey)
      }}
      className={`absolute flex flex-col overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.28)] ${
        isSelected ? "border-emerald-300 bg-emerald-400/20" : "border-sky-300/80 bg-sky-500/14"
      }`}
      style={{
        left: (draftRoom.x + offsetX) * scale,
        top: (draftRoom.y + offsetY) * scale,
        width: draftRoom.widthM * scale,
        height: draftRoom.heightM * scale,
      }}
    >
      {room.showTicks !== false && (
        <>
          <svg
            className="pointer-events-none absolute -top-6 left-0"
            width={draftRoom.widthM * scale}
            height="20"
            style={{ overflow: "visible" }}
          >
            {Array.from({ length: Math.ceil(draftRoom.widthM) + 1 }).map((_, meterIdx) => {
              const meterPos = meterIdx
              if (meterPos > draftRoom.widthM) return null
              const xPos = (meterPos / draftRoom.widthM) * (draftRoom.widthM * scale)

              return (
                <g key={`meter-${meterIdx}`}>
                  <line x1={xPos} y1="2" x2={xPos} y2="16" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
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
                  {meterIdx < Math.ceil(draftRoom.widthM) &&
                    Array.from({ length: 3 }).map((_, footIdx) => {
                      const footPos = meterPos + (footIdx + 1) * 0.3048
                      if (footPos > draftRoom.widthM) return null
                      const footXPos = (footPos / draftRoom.widthM) * (draftRoom.widthM * scale)
                      return (
                        <line
                          key={`foot-h-${meterIdx}-${footIdx}`}
                          x1={footXPos}
                          y1="8"
                          x2={footXPos}
                          y2="16"
                          stroke="rgba(255,255,255,0.38)"
                          strokeWidth="1"
                        />
                      )
                    })}
                </g>
              )
            })}
          </svg>

          <svg
            className="pointer-events-none absolute -left-12 top-0"
            width="40"
            height={draftRoom.heightM * scale}
            style={{ overflow: "visible" }}
          >
            {Array.from({ length: Math.ceil(draftRoom.heightM) + 1 }).map((_, meterIdx) => {
              const meterPos = meterIdx
              if (meterPos > draftRoom.heightM) return null
              const yPos = (meterPos / draftRoom.heightM) * (draftRoom.heightM * scale)

              return (
                <g key={`meter-v-${meterIdx}`}>
                  <line x1="28" y1={yPos} x2="40" y2={yPos} stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
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
                  {meterIdx < Math.ceil(draftRoom.heightM) &&
                    Array.from({ length: 3 }).map((_, footIdx) => {
                      const footPos = meterPos + (footIdx + 1) * 0.3048
                      if (footPos > draftRoom.heightM) return null
                      const footYPos = (footPos / draftRoom.heightM) * (draftRoom.heightM * scale)
                      return (
                        <line
                          key={`foot-v-${meterIdx}-${footIdx}`}
                          x1="34"
                          y1={footYPos}
                          x2="40"
                          y2={footYPos}
                          stroke="rgba(255,255,255,0.38)"
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

      {room.dataset && (
        <RoomHeatmapOverlay
          dataset={room.dataset}
          widthM={draftRoom.widthM}
          heightM={draftRoom.heightM}
          scale={scale}
        />
      )}


      <div className="pointer-events-none absolute inset-x-1 top-1 rounded-lg bg-black/55 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{room.name}</span>
          {room.dataset && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
              {analysis?.deadzones.length ?? 0} deadzones
            </span>
          )}
        </div>
        <div className="text-[10px] text-gray-200/90">
          {draftRoom.widthM.toFixed(1)}m x {draftRoom.heightM.toFixed(1)}m · {(draftRoom.widthM * 3.28084).toFixed(1)}ft x {(draftRoom.heightM * 3.28084).toFixed(1)}ft
        </div>
      </div>

      {!room.dataset && (
        <div
          onMouseDown={startResize}
          className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-sm bg-sky-200/90"
        />
      )}
    </div>
  )
}
