"use client"

import { Button } from "@/components/ui/button"
import { useDataset } from "@/store/useDataset"

export default function SplitscreenSelector() {
  const { signalType, setSignalType, compareMode, setCompareMode } = useDataset()

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold">Splitscreen</h3>
      <Button
        variant={compareMode ? "default" : "secondary"}
        onClick={() => setCompareMode(!compareMode)}
      >
        Split Screen Comparison
      </Button>
    </div>
  )
}