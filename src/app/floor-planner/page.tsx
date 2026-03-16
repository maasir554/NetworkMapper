"use client"

import FloorToolbar from "@/components/floor/FloorToolbar"
import FloorCanvas from "@/components/floor/FloorCanvas"
import FloorSidebar from "@/components/floor/FloorSidebar"

export default function FloorPlannerPage() {
  return (
    <div className="h-screen flex bg-neutral-950 text-white">
      {/* sidebar on the left */}
      <FloorSidebar />

      <div className="flex-1 flex flex-col">
        <FloorToolbar />
        <FloorCanvas />
      </div>
    </div>
  )
}