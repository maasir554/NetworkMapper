"use client"

import UploadPanel from "@/components/UploadPanel"
import DatasetInfo from "@/components/DatasetInfo"
import HeatmapScene from "@/components/HeatmapScene"
import SplitscreenSelector from "@/components/SplitscreenSelector"
import TopBar from "@/components/TopBar"
import { Card } from "@/components/ui/card"
import { useDataset } from "@/store/useDataset"

export default function Home() {
  const compareMode = useDataset((s) => s.compareMode)
  const datasetA = useDataset((s) => s.datasetA)
  const datasetB = useDataset((s) => s.datasetB)
  const filenameA = useDataset((s) => s.filenameA)
  const filenameB = useDataset((s) => s.filenameB)

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="w-[320px] shrink-0 p-4 space-y-4 border-r border-border bg-card">
          <div className="text-xl font-semibold px-2 pt-1">Controls</div>

          <Card className="p-4">
            <UploadPanel />
          </Card>

          <Card className="p-4">
            <SplitscreenSelector />
          </Card>

          <Card className="p-4">
            <DatasetInfo />
          </Card>
        </div>

        {/* Viewer */}
        <div className="flex-1 p-6 flex gap-6 flex-col">
          {compareMode ? (
            <div className="flex-1 flex gap-6">
              <Card className="flex-1 overflow-hidden">
                <HeatmapScene initialSignal="wifi" dataset={datasetA} filename={filenameA} />
              </Card>

              <Card className="flex-1 overflow-hidden">
                <HeatmapScene initialSignal="wifi" dataset={datasetB} filename={filenameB} />
              </Card>
            </div>
          ) : (
            <Card className="flex-1 overflow-hidden">
              <HeatmapScene initialSignal="wifi" dataset={datasetA} filename={filenameA} />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}