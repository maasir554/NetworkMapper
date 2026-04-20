"use client"

import { Button } from "@/components/ui/button"
import { useDataset } from "@/store/useDataset"

export default function SplitscreenSelector() {
  const compareMode = useDataset((s) => s.compareMode)
  const setCompareMode = useDataset((s) => s.setCompareMode)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="font-semibold">View Mode</h3>
        <p className="text-xs text-muted-foreground">
          Switch between one-map review and side-by-side comparison.
        </p>
      </div>
      <Button
        variant={compareMode ? "default" : "secondary"}
        onClick={() => setCompareMode(!compareMode)}
      >
        {compareMode ? "Comparison enabled" : "Enable split-screen comparison"}
      </Button>
    </div>
  )
}
