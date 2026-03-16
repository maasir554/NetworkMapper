"use client"

import { useDataset } from "@/store/useDataset"

export default function DatasetInfo() {
  const dataset = useDataset((s) => s.dataset)

  if (!dataset) {
    return (
      <div className="text-sm text-muted-foreground">
        No dataset loaded
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <h3 className="font-semibold text-lg">Dataset Info</h3>

      <div className="flex justify-between">
        <span className="text-muted-foreground">Room</span>
        <span>{dataset.roomName}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-muted-foreground">Size</span>
        <span>{dataset.width} × {dataset.height} m</span>
      </div>

      <div className="flex justify-between">
        <span className="text-muted-foreground">Points</span>
        <span>{dataset.points.length}</span>
      </div>
    </div>
  )
}