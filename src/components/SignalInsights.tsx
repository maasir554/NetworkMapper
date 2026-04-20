"use client"

import { useState } from "react"
import { analyzeSignalDataset, getSignalLabel } from "@/lib/signalAnalysis"
import { RouterMarker } from "@/lib/routerPlanning"
import { SignalType } from "@/store/useDataset"
import { RoomHeatmap } from "@/types/heatmap"

export default function SignalInsights({
  dataset,
  signal,
  routerMarkers = [],
}: {
  dataset: RoomHeatmap | null
  signal: SignalType
  routerMarkers?: RouterMarker[]
}) {
  const [collapsed, setCollapsed] = useState(false)
  const analysis = analyzeSignalDataset(dataset, signal)

  if (!analysis) {
    return (
      <div className="absolute right-3 top-3 z-10 max-w-[320px] rounded-2xl border border-white/10 bg-black/55 p-4 text-sm text-neutral-200 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">No coverage audit yet</div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-full border border-white/10 px-2 py-1 text-[11px]"
          >
            {collapsed ? "Open" : "Hide"}
          </button>
        </div>
        {!collapsed && (
          <p className="mt-1 text-xs text-neutral-300">
            Upload a valid room map to audit weak coverage and recommend a router position.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="absolute right-3 top-3 z-10 max-w-[340px] rounded-2xl border border-white/10 bg-black/55 p-4 text-sm text-neutral-100 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-neutral-400">Coverage audit</div>
          <div className="mt-1 font-semibold">{getSignalLabel(signal)}</div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-neutral-200"
        >
          {collapsed ? "Open" : "Hide"}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-white/5 p-2">
              <div className="text-neutral-400">Average</div>
              <div className="mt-1 text-sm font-semibold">{analysis.average} dBm</div>
            </div>
            <div className="rounded-xl bg-white/5 p-2">
              <div className="text-neutral-400">Worst</div>
              <div className="mt-1 text-sm font-semibold">{analysis.worst} dBm</div>
            </div>
            <div className="rounded-xl bg-white/5 p-2">
              <div className="text-neutral-400">Threshold</div>
              <div className="mt-1 text-sm font-semibold">{analysis.threshold} dBm</div>
            </div>
            <div className="rounded-xl bg-white/5 p-2">
              <div className="text-neutral-400">Deadzones</div>
              <div className="mt-1 text-sm font-semibold">{analysis.deadzones.length}</div>
            </div>
          </div>

          {analysis.existingRouterEstimate && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-amber-200">
                {analysis.existingRouterEstimate.label}
              </div>
              <div className="mt-1 font-semibold">
                {analysis.existingRouterEstimate.x}m, {analysis.existingRouterEstimate.y}m
              </div>
              <p className="mt-1 text-xs text-amber-50/90">{analysis.existingRouterEstimate.rationale}</p>
              <details className="mt-2 text-[11px] text-amber-100/85">
                <summary className="cursor-pointer">Why this point</summary>
                <p className="mt-2">{analysis.existingRouterEstimate.mathSummary}</p>
              </details>
            </div>
          )}

          {analysis.routerEstimate && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-emerald-200">
                {analysis.routerEstimate.label}
              </div>
              <div className="mt-1 font-semibold">
                {analysis.routerEstimate.x}m, {analysis.routerEstimate.y}m
              </div>
              <p className="mt-1 text-xs text-emerald-50/90">{analysis.routerEstimate.rationale}</p>
              <details className="mt-2 text-[11px] text-emerald-100/85">
                <summary className="cursor-pointer">Why this point</summary>
                <p className="mt-2">{analysis.routerEstimate.mathSummary}</p>
              </details>
            </div>
          )}

          {signal === "wifi" && routerMarkers.length > 0 && (
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs">
              <div className="text-xs uppercase tracking-[0.16em] text-sky-100">
                Router list
              </div>
              <div className="mt-2 space-y-2">
                {routerMarkers.map((marker) => (
                  <div key={marker.id} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-2 py-2">
                    <span>{marker.label ?? marker.roomName ?? "Router"}</span>
                    <span className="text-sky-50">
                      {marker.x.toFixed(1)}m, {marker.y.toFixed(1)}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {signal !== "wifi" && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-neutral-200/90">
              Router placement is only calculated for Wi-Fi. LTE and 5G layers stay view-only so the app does not imply tower or cellular source installation points.
            </div>
          )}

          {analysis.deadzones.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Weak coverage zones
              </div>
              {analysis.deadzones.slice(0, 3).map((zone) => (
                <div key={zone.id} className="rounded-xl bg-white/5 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium capitalize">{zone.severity}</span>
                    <span>{zone.areaM2.toFixed(1)} m2</span>
                  </div>
                  <div className="mt-1 text-neutral-300">
                    Center {zone.centroid.x.toFixed(1)}m, {zone.centroid.y.toFixed(1)}m
                  </div>
                  <div className="text-neutral-300">Worst {zone.minValue.toFixed(1)} dBm</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-400/10 p-3 text-xs text-emerald-100">
              No contiguous deadzones detected below {analysis.threshold} dBm.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
