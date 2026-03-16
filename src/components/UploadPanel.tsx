"use client"

import { useDataset } from "@/store/useDataset"
import { RoomHeatmap } from "@/types/heatmap"
import { Button } from "@/components/ui/button"

export default function UploadPanel() {
  const setDatasetA = useDataset((s) => s.setDatasetA)
  const setDatasetB = useDataset((s) => s.setDatasetB)
  const compareMode = useDataset((s) => s.compareMode)
  const datasetA = useDataset((s) => s.datasetA)
  const datasetB = useDataset((s) => s.datasetB)

  const loadFile = async (file: File, setter: any) => {
    const text = await file.text()
    const json: RoomHeatmap = JSON.parse(text)
    // Extract filename without extension
    const filename = file.name.replace(/\.json$/, "")
    setter(json, filename)
    // allow re-uploading same file by clearing input value
    const input = document.getElementById("fileA") as HTMLInputElement | null
    if (input) input.value = ""
    const inputB = document.getElementById("fileB") as HTMLInputElement | null
    if (inputB) inputB.value = ""
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Upload Room Data</h2>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-muted-foreground font-medium">Room A</label>
          <input id="fileA" type="file" accept="application/json" hidden
            onChange={(e)=>e.target.files && loadFile(e.target.files[0], setDatasetA)} />

          <Button 
            onClick={()=>document.getElementById("fileA")?.click()}
            className="w-full"
            variant={datasetA ? "default" : "outline"}
          >
            {datasetA ? "✓ Loaded" : "Upload File"}
          </Button>
        </div>

        {compareMode && (
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground font-medium">Room B</label>
            <input id="fileB" type="file" accept="application/json" hidden
              onChange={(e)=>e.target.files && loadFile(e.target.files[0], setDatasetB)} />

            <Button 
              onClick={()=>document.getElementById("fileB")?.click()}
              className="w-full"
              variant={datasetB ? "default" : "outline"}
            >
              {datasetB ? "✓ Loaded" : "Upload File"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}