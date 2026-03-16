"use client"

import React, { useEffect } from "react"
import { useFloorPlan } from "@/store/useFloorPlan"
import FloorRoomRect from "./FloorRoomRect"

export default function FloorCanvas() {
  const { floors, currentFloorId } = useFloorPlan((s) => ({
    floors: s.floors,
    currentFloorId: s.currentFloorId,
  }))
  const currentFloor = floors.find((f) => f.id === currentFloorId)
  const rooms = currentFloor?.rooms ?? []

  const scale = useFloorPlan((s) => s.scale)
  const setScale = useFloorPlan((s) => s.setScale)
  const offsetX = useFloorPlan((s) => s.offsetX)
  const offsetY = useFloorPlan((s) => s.offsetY)
  const setOffset = useFloorPlan((s) => s.setOffset)
  const updateRoom = useFloorPlan((s) => s.updateRoom)
  const selectedRoomIds = useFloorPlan((s) => s.selectedRoomIds)
  const toggleRoomSelection = useFloorPlan((s) => s.toggleRoomSelection)


  // convert world coordinate (meters) to pixel position
  const toPx = (x: number) => (x + offsetX) * scale
  const toPy = (y: number) => (y + offsetY) * scale

  const SNAP_DISTANCE = 0.4 // meters

  

const snapToNearbyRoom = (
    candidate: { x: number; y: number; widthM: number; heightM: number; id: string }
  ) => {
    let newX = candidate.x
    let newY = candidate.y

    rooms.forEach((r) => {
      if (r.id === candidate.id) return

      // Snap left edge
      if (Math.abs(candidate.x - (r.x + r.widthM)) < SNAP_DISTANCE) {
        newX = r.x + r.widthM
      }

      // Snap right edge
      if (Math.abs(candidate.x + candidate.widthM - r.x) < SNAP_DISTANCE) {
        newX = r.x - candidate.widthM
      }

      // Snap top
      if (Math.abs(candidate.y - (r.y + r.heightM)) < SNAP_DISTANCE) {
        newY = r.y + r.heightM
      }

      // Snap bottom
      if (Math.abs(candidate.y + candidate.heightM - r.y) < SNAP_DISTANCE) {
        newY = r.y - candidate.heightM
      }
    })

    return { x: newX, y: newY }
  }

  const isOverlap = (
    a: { x: number; y: number; widthM: number; heightM: number },
    b: { x: number; y: number; widthM: number; heightM: number }
  ) =>
    a.x < b.x + b.widthM &&
    a.x + a.widthM > b.x &&
    a.y < b.y + b.heightM &&
    a.y + a.heightM > b.y

  const collides = (candidate: {
    id: string
    x: number
    y: number
    widthM: number
    heightM: number
  }) =>
    rooms.some(
      (r) => r.id !== candidate.id && isOverlap(candidate, r)
    )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        const newScale = scale * 1.2
        setScale(newScale)
        setOffset(offsetX * 1.2, offsetY * 1.2)
      }
      if (e.key === "-") {
        const newScale = scale / 1.2
        setScale(newScale)
        setOffset(offsetX / 1.2, offsetY / 1.2)
      }
      if (e.key === "0") {
        setScale(60)
        setOffset(0, 0)
      }
      if (e.key === "Escape") {
        toggleRoomSelection(null, false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [setScale, setOffset, toggleRoomSelection])

  // panning state
  const isPanning = React.useRef(false)
  const lastMouse = React.useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    // Allow panning on empty space (not on a room)
    if (e.target === e.currentTarget) {
      isPanning.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
      e.currentTarget.style.cursor = "grabbing"
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    // Pan is positive when mouse moves left/up (offset increases)
    setOffset(offsetX - dx / scale, offsetY - dy / scale)
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      isPanning.current = false
      if (e.currentTarget) e.currentTarget.style.cursor = "default"
    }
  }

  return (
    <div
      className="flex-1 relative bg-neutral-900 overflow-hidden"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) toggleRoomSelection(null, false)
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(e) => {
        e.preventDefault()
        // invert scroll: wheel down (positive) should zoom out
        const factor = e.deltaY > 0 ? 0.9 : 1.1
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        const worldX = cx / scale - offsetX
        const worldY = cy / scale - offsetY
        const newScale = scale * factor
        setScale(newScale)
        setOffset(cx / newScale - worldX, cy / newScale - worldY)
      }}
      style={{ cursor: 'grab' }}
    >


      {rooms.map((room) => (
        <FloorRoomRect key={room.id} room={room} />
      ))}
    </div>
  )
}