"use client"

import { Button } from "@/components/ui/button"
import { useDataset } from "@/store/useDataset"
import { RoomHeatmap } from "@/types/heatmap"
import { normalizeRoomHeatmap } from "@/lib/heatmapParser"
import { sampleRoomA, sampleRoomB } from "@/lib/sampleData"

export default function UploadPanel() {
  const setDatasetA = useDataset((s) => s.setDatasetA)
  const setDatasetB = useDataset((s) => s.setDatasetB)
  const compareMode = useDataset((s) => s.compareMode)
  const datasetA = useDataset((s) => s.datasetA)
  const datasetB = useDataset((s) => s.datasetB)

  const loadFile = async (
    file: File,
    setter: (data: RoomHeatmap, filename: string) => void
  ) => {
    const text = await file.text()
    try {
      const json = JSON.parse(text)
      const normalized = normalizeRoomHeatmap(json, file.name.replace(/\.json$/i, ""))
      if (!normalized) {
        alert("This file is not in a supported room heatmap JSON format.")
        return
      }
      const filename = file.name.replace(/\.json$/i, "")
      setter(normalized, filename)
    } catch (error) {
      console.error("failed to parse room json", error)
      alert("Unable to parse JSON. Please verify the file format.")
    } finally {
      const inputA = document.getElementById("fileA") as HTMLInputElement | null
      const inputB = document.getElementById("fileB") as HTMLInputElement | null
      if (inputA) inputA.value = ""
      if (inputB) inputB.value = ""
    }
  }

  const loadSample = (index: 1 | 2) => {
    const sample = index === 1 ? sampleRoomA : sampleRoomB
    const setter = index === 1 ? setDatasetA : setDatasetB
    setter(sample, sample.roomName)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Upload Room Data</h2>
        <p className="text-xs text-muted-foreground">
          Load one or two room heatmaps and inspect them in 3D.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Room A</label>
          <input
            id="fileA"
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files && loadFile(e.target.files[0], setDatasetA)}
          />
          <Button
            onClick={() => document.getElementById("fileA")?.click()}
            className="w-full"
            variant={datasetA ? "default" : "outline"}
          >
            {datasetA ? "Loaded" : "Upload file"}
          </Button>
          <Button onClick={() => loadSample(1)} variant="secondary" className="w-full">
            Load sample room A
          </Button>
        </div>

        {compareMode && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Room B</label>
            <input
              id="fileB"
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => e.target.files && loadFile(e.target.files[0], setDatasetB)}
            />
            <Button
              onClick={() => document.getElementById("fileB")?.click()}
              className="w-full"
              variant={datasetB ? "default" : "outline"}
            >
              {datasetB ? "Loaded" : "Upload file"}
            </Button>
            <Button onClick={() => loadSample(2)} variant="secondary" className="w-full">
              Load sample room B
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
