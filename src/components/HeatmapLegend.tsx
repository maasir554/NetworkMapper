"use client"

import { useState } from "react"
import { SignalType } from "@/store/useDataset"
import { Card } from "./ui/card"

const legendStops: Record<SignalType, { value: number; label: string }[]> = {
  wifi: [
    { value: -90, label: "-90" },
    { value: -80, label: "-80" },
    { value: -70, label: "-70" },
    { value: -60, label: "-60" },
    { value: -50, label: "-50" },
  ],
  lte: [
    { value: -120, label: "-120" },
    { value: -110, label: "-110" },
    { value: -100, label: "-100" },
    { value: -90, label: "-90" },
    { value: -80, label: "-80" },
  ],
  nr: [
    { value: -120, label: "-120" },
    { value: -110, label: "-110" },
    { value: -100, label: "-100" },
    { value: -90, label: "-90" },
    { value: -80, label: "-80" },
  ],
}

export default function HeatmapLegend({ signal }: { signal: SignalType }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Card className="absolute bottom-6 left-6 z-10 border-white/10 bg-card/75 p-3 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Legend</h3>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-muted-foreground"
        >
          {collapsed ? "Open" : "Hide"}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="mb-2 mt-3 h-3 w-56 rounded-md bg-linear-to-r from-red-500 via-yellow-400 to-green-500" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {legendStops[signal].map((stop) => (
              <span key={stop.value}>{stop.label}</span>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
