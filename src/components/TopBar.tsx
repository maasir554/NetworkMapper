"use client"

import { useDataset } from "@/store/useDataset"

export default function TopBar() {
  const dataset = useDataset(s => s.dataset)

  return (
    <div className="h-14 px-6 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur">
      <div className="font-semibold text-lg tracking-tight">
        RF Heatmap Portal
      </div>

      {dataset && (
        <div className="text-sm text-muted-foreground">
          Viewing: <span className="text-white font-medium">{dataset.roomName}</span>
        </div>
      )}
    </div>
  )
}