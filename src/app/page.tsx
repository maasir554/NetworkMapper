"use client"

import { useEffect, useState } from "react"
import DatasetInfo from "@/components/DatasetInfo"
import HeatmapScene from "@/components/HeatmapScene"
import TopBar from "@/components/TopBar"
import UploadPanel from "@/components/UploadPanel"
import FloorCanvas from "@/components/floor/FloorCanvas"
import FloorSidebar from "@/components/floor/FloorSidebar"
import FloorToolbar from "@/components/floor/FloorToolbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useDataset } from "@/store/useDataset"

type WorkspaceView = "network" | "compare" | "planner"

export default function Home() {
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("network")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const setCompareMode = useDataset((s) => s.setCompareMode)
  const datasetA = useDataset((s) => s.datasetA)
  const datasetB = useDataset((s) => s.datasetB)
  const filenameA = useDataset((s) => s.filenameA)
  const filenameB = useDataset((s) => s.filenameB)

  useEffect(() => {
    setCompareMode(workspaceView === "compare")
  }, [setCompareMode, workspaceView])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${sidebarCollapsed ? "w-[76px]" : "w-[340px]"} flex shrink-0 flex-col border-r border-border bg-card/80 transition-[width]`}
        >
          <div className="flex items-center justify-between border-b border-border p-3">
            {!sidebarCollapsed && <div className="text-lg font-semibold">Workspace</div>}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground"
            >
              {sidebarCollapsed ? ">" : "<"}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="rounded-2xl border border-border/80 bg-background/70 p-4">
                <div className="text-xl font-semibold">Workspace</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  One app for upload, coverage review, router placement, room planning, and comparison.
                </p>
              </div>

              <Card className="space-y-3 p-4">
                <div>
                  <div className="text-sm font-semibold">Mode</div>
                  <div className="text-xs text-muted-foreground">
                    Switch between the live network view, comparison view, and planner.
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant={workspaceView === "network" ? "default" : "outline"}
                    onClick={() => setWorkspaceView("network")}
                  >
                    Network view
                  </Button>
                  <Button
                    variant={workspaceView === "compare" ? "default" : "outline"}
                    onClick={() => setWorkspaceView("compare")}
                  >
                    Split comparison
                  </Button>
                  <Button
                    variant={workspaceView === "planner" ? "default" : "outline"}
                    onClick={() => setWorkspaceView("planner")}
                  >
                    Floor planner
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <UploadPanel />
              </Card>

              <Card className="p-4">
                <DatasetInfo />
              </Card>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-hidden bg-[radial-gradient(circle_at_top,#13314f_0%,#09131f_38%,#050a12_100%)] p-4 md:p-6">
          {workspaceView !== "planner" && (
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/80">
              {workspaceView === "network"
                ? "Single-room network view with Wi-Fi router audit and optional LTE/5G overlays."
                : "Side-by-side split comparison for Dataset A and Dataset B using the same heatmap tools."}
            </div>
          )}

          {workspaceView === "network" && (
            <Card className="min-h-0 flex-1 overflow-hidden border-white/10 bg-black/25">
              <HeatmapScene initialSignal="wifi" dataset={datasetA} filename={filenameA} />
            </Card>
          )}

          {workspaceView === "compare" && (
            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
              <Card className="min-h-[320px] overflow-hidden border-white/10 bg-black/25">
                <HeatmapScene initialSignal="wifi" dataset={datasetA} filename={filenameA} />
              </Card>
              <Card className="min-h-[320px] overflow-hidden border-white/10 bg-black/25">
                <HeatmapScene initialSignal="wifi" dataset={datasetB} filename={filenameB} />
              </Card>
            </div>
          )}

          {workspaceView === "planner" && (
            <Card className="min-h-0 flex flex-1 overflow-hidden border-white/10 bg-[#07111d]">
              <div className="flex h-full w-full flex-col">
                <FloorToolbar />
                <div className="flex min-h-0 flex-1 overflow-hidden">
                  <FloorSidebar />
                  <FloorCanvas />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
