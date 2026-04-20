"use client"

import Link from "next/link"
import { useDataset } from "@/store/useDataset"

export default function TopBar() {
  const datasetA = useDataset((s) => s.datasetA)
  const datasetB = useDataset((s) => s.datasetB)
  const compareMode = useDataset((s) => s.compareMode)
  const loadedCount = [datasetA, datasetB].filter(Boolean).length

  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-card/70 px-6 backdrop-blur">
      <div>
        <div className="text-lg font-semibold tracking-tight">Network Mapper</div>
        <div className="text-xs text-muted-foreground">
          Grid-driven RF coverage review and floor planning
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/floor-planner"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Floor planner
        </Link>
        <Link
          href="/how-it-works"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          How it works
        </Link>
        <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {compareMode ? "Compare mode" : "Single view"} · {loadedCount} dataset
          {loadedCount === 1 ? "" : "s"} loaded
        </div>
      </div>
    </div>
  )
}
