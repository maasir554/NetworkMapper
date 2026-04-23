"use client"

import React, { useCallback, useEffect, useMemo, useRef } from "react"
import { buildWholeFloorRouterMarkers, RouterMarker } from "@/lib/routerPlanning"
import FloorRoomRect from "./FloorRoomRect"
import { useFloorPlan } from "@/store/useFloorPlan"

const MIN_SCALE = 12
const MAX_SCALE = 260

export default function FloorCanvas() {
  const { floors, currentFloorId } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
  }))
  const currentFloor = floors.find((floor) => floor.id === currentFloorId)
  const rooms = useMemo(() => currentFloor?.rooms ?? [], [currentFloor])

  const scale = useFloorPlan((s) => s.scale)
  const setScale = useFloorPlan((s) => s.setScale)
  const offsetX = useFloorPlan((s) => s.offsetX)
  const offsetY = useFloorPlan((s) => s.offsetY)
  const setOffset = useFloorPlan((s) => s.setOffset)
  const toggleRoomSelection = useFloorPlan((s) => s.toggleRoomSelection)
  const snapUnit = useFloorPlan((s) => s.snapUnit)

  const scaleRef = useRef(scale)
  const offsetRef = useRef({ x: offsetX, y: offsetY })
  const canvasRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  useEffect(() => {
    offsetRef.current = { x: offsetX, y: offsetY }
  }, [offsetX, offsetY])

  const zoomAtPoint = useCallback((targetScale: number, clientX?: number, clientY?: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale))
    const rect = canvasRef.current?.getBoundingClientRect()

    if (!rect || clientX === undefined || clientY === undefined) {
      scaleRef.current = clamped
      setScale(clamped)
      return
    }

    const localX = clientX - rect.left
    const localY = clientY - rect.top
    const worldX = localX / scaleRef.current - offsetRef.current.x
    const worldY = localY / scaleRef.current - offsetRef.current.y
    const nextOffsetX = localX / clamped - worldX
    const nextOffsetY = localY / clamped - worldY

    scaleRef.current = clamped
    offsetRef.current = { x: nextOffsetX, y: nextOffsetY }
    setScale(clamped)
    setOffset(nextOffsetX, nextOffsetY)
  }, [setOffset, setScale])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      const centerX = rect ? rect.left + rect.width / 2 : undefined
      const centerY = rect ? rect.top + rect.height / 2 : undefined

      if (event.key === "+" || event.key === "=") {
        zoomAtPoint(scaleRef.current * 1.12, centerX, centerY)
      }
      if (event.key === "-") {
        zoomAtPoint(scaleRef.current / 1.12, centerX, centerY)
      }
      if (event.key === "0") {
        scaleRef.current = 60
        offsetRef.current = { x: 0, y: 0 }
        setScale(60)
        setOffset(0, 0)
      }
      if (event.key === "Escape") {
        toggleRoomSelection(null, false)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [setOffset, setScale, toggleRoomSelection, zoomAtPoint])

  const isPanning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const gridSize = snapUnit === "meters" ? 1 : 0.3048
  const majorGridPx = Math.max(20, scale * gridSize)
  const minorGridPx = Math.max(10, majorGridPx / 5)
  const axisX = offsetX * scale
  const axisY = offsetY * scale

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: "#f8fafc",
      backgroundImage: `
        linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px),
        linear-gradient(rgba(37, 99, 235, 0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(37, 99, 235, 0.2) 1px, transparent 1px)
      `,
      backgroundSize: `${minorGridPx}px ${minorGridPx}px, ${minorGridPx}px ${minorGridPx}px, ${majorGridPx}px ${majorGridPx}px, ${majorGridPx}px ${majorGridPx}px`,
      backgroundPosition: `${axisX}px ${axisY}px, ${axisX}px ${axisY}px, ${axisX}px ${axisY}px, ${axisX}px ${axisY}px`,
    }),
    [axisX, axisY, majorGridPx, minorGridPx]
  )
  const wholeFloorPlan = useMemo(() => buildWholeFloorRouterMarkers(rooms, "wifi"), [rooms])
  const floorMarkers = wholeFloorPlan.markers

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (event.target === event.currentTarget) {
      isPanning.current = true
      lastMouse.current = { x: event.clientX, y: event.clientY }
      event.currentTarget.style.cursor = "grabbing"
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return
    const dx = event.clientX - lastMouse.current.x
    const dy = event.clientY - lastMouse.current.y
    lastMouse.current = { x: event.clientX, y: event.clientY }
    setOffset(
      offsetRef.current.x + dx / scaleRef.current,
      offsetRef.current.y + dy / scaleRef.current
    )
  }

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      isPanning.current = false
      event.currentTarget.style.cursor = "grab"
    }
  }

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 overflow-hidden"
      onClick={(event) => {
        if (event.target === event.currentTarget) toggleRoomSelection(null, false)
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(event) => {
        event.preventDefault()
        const zoomFactor = Math.exp(-event.deltaY * 0.0012)
        zoomAtPoint(scaleRef.current * zoomFactor, event.clientX, event.clientY)
      }}
      style={{ cursor: "grab", ...backgroundStyle }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-sky-300/25"
        style={{ left: axisX }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 h-px bg-sky-300/25"
        style={{ top: axisY }}
      />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground backdrop-blur">
        Graph grid: {snapUnit === "meters" ? "1m" : "1ft"} snap. Scroll to zoom, drag empty space to pan.
      </div>

      {rooms.map((room) => (
        <FloorRoomRect key={room.id} room={room} />
      ))}

      {floorMarkers.map((floorMarker) => (
        <div
          key={floorMarker.id}
          className="pointer-events-none absolute"
          style={{
            left: (floorMarker.x + offsetX) * scale,
            top: (floorMarker.y + offsetY) * scale,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <div
              className={`h-5 w-5 rounded-full border-2 border-white ${
                floorMarker.kind === "existing" ? "bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.75)]" : "bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.85)]"
              }`}
            />
            <div className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-emerald-100">
              {floorMarker.label ?? "Floor router"}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
