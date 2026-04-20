"use client"

import { Card } from "@/components/ui/card"
import { useDataset } from "@/store/useDataset"

export default function DatasetInfo() {
  const datasetA = useDataset((s) => s.datasetA)
  const datasetB = useDataset((s) => s.datasetB)
  const compareMode = useDataset((s) => s.compareMode)
  const filenameA = useDataset((s) => s.filenameA)
  const filenameB = useDataset((s) => s.filenameB)

  const cards = [
    { key: "a", label: "Dataset A", name: filenameA, dataset: datasetA },
    { key: "b", label: "Dataset B", name: filenameB, dataset: datasetB },
  ].filter((entry) => (compareMode ? true : entry.key === "a"))

  if (!datasetA && (!compareMode || !datasetB)) {
    return (
      <div className="text-sm text-muted-foreground">
        Load a room JSON to inspect its dimensions and sample density.
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <h3 className="text-lg font-semibold">Dataset Info</h3>
        <p className="text-xs text-muted-foreground">
          Quick readout for the currently loaded room maps.
        </p>
      </div>

      {cards.map(({ key, label, name, dataset }) => (
        <Card key={key} className="border-border/70 bg-background/50 p-3">
          {dataset ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{name ?? dataset.roomName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room</span>
                <span>{dataset.roomName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>{dataset.width} x {dataset.height} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Samples</span>
                <span>{dataset.points.length}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-medium">{label}</div>
              <p className="text-xs text-muted-foreground">No file loaded yet.</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
