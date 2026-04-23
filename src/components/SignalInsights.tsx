"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { analyzeSignalDataset, getSignalLabel } from "@/lib/signalAnalysis"
import { RouterMarker } from "@/lib/routerPlanning"
import { SignalType } from "@/store/useDataset"
import { RoomHeatmap } from "@/types/heatmap"

export default function SignalInsights({
  dataset,
  signal,
  routerMarkers = [],
  overlay = false,
}: {
  dataset: RoomHeatmap | null
  signal: SignalType
  routerMarkers?: RouterMarker[]
  overlay?: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)
  const analysis = analyzeSignalDataset(dataset, signal)

  const containerClasses = overlay
    ? `absolute bottom-6 right-6 z-10 ${collapsed ? "w-56" : "w-80"} ${collapsed ? "h-auto" : "h-[280px]"} overflow-hidden rounded-2xl border border-white/10 bg-card/75 text-sm text-foreground shadow-xl backdrop-blur-md transition-all duration-300`
    : "h-full overflow-y-auto rounded-2xl border border-border bg-card p-4 text-sm text-foreground"

  const innerContent = (
    <div className={`h-full flex flex-col ${overlay ? "p-4" : ""}`}>
      <div className="flex items-start justify-between gap-3 sticky top-0 bg-transparent pb-2 z-10">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold">Coverage audit</div>
          <div className="mt-0.5 font-semibold text-foreground line-clamp-1">{getSignalLabel(signal)}</div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex items-center justify-center rounded-full border border-border bg-background/50 p-1.5 text-muted-foreground hover:bg-background/80 transition-colors shrink-0"
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="relative flex-1 min-h-0">
          <div className="h-full overflow-y-auto pr-1 space-y-3 pb-8">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl border border-border bg-muted p-2">
                <div className="text-muted-foreground">Average</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{analysis?.average ?? "N/A"} dBm</div>
              </div>
              <div className="rounded-xl border border-border bg-muted p-2">
                <div className="text-muted-foreground">Worst</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{analysis?.worst ?? "N/A"} dBm</div>
              </div>
              <div className="rounded-xl border border-border bg-muted p-2">
                <div className="text-muted-foreground">Threshold</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{analysis?.threshold ?? "N/A"} dBm</div>
              </div>
              <div className="rounded-xl border border-border bg-muted p-2">
                <div className="text-muted-foreground">Deadzones</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{analysis?.deadzones.length ?? 0}</div>
              </div>
            </div>

            {analysis?.existingRouterEstimate && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-amber-700 font-bold">
                  {analysis.existingRouterEstimate.label}
                </div>
                <div className="mt-1 font-semibold text-foreground">
                  {analysis.existingRouterEstimate.x}m, {analysis.existingRouterEstimate.y}m
                </div>
                <p className="mt-1 text-[11px] text-amber-700 leading-tight">{analysis.existingRouterEstimate.rationale}</p>
              </div>
            )}

            {analysis?.routerEstimate && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-700 font-bold">
                  {analysis.routerEstimate.label}
                </div>
                <div className="mt-1 font-semibold text-foreground">
                  {analysis.routerEstimate.x}m, {analysis.routerEstimate.y}m
                </div>
                <p className="mt-1 text-[11px] text-emerald-700 leading-tight">{analysis.routerEstimate.rationale}</p>
              </div>
            )}

            {signal === "wifi" && routerMarkers.length > 0 && (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs">
                <div className="text-[10px] uppercase tracking-[0.16em] text-sky-700 font-bold">
                  Router list
                </div>
                <div className="mt-2 space-y-2">
                  {routerMarkers.map((marker) => (
                    <div key={marker.id} className="flex items-center justify-between gap-3 rounded-lg border border-sky-200 bg-white px-2 py-2">
                      <span className="text-foreground text-[11px]">{marker.label ?? marker.roomName ?? "Router"}</span>
                      <span className="text-sky-700 font-medium">
                        {marker.x.toFixed(1)}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!analysis && (
              <p className="mt-2 text-xs text-muted-foreground">
                Upload a valid room map to audit weak coverage and recommend a router position.
              </p>
            )}
          </div>
          {/* Scroll fade overlay */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/90 to-transparent" />
        </div>
      )}
    </div>
  )

  return <div className={containerClasses}>{innerContent}</div>
}