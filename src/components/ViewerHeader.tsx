"use client"

import { SignalType } from "@/store/useDataset"

const labels: Record<SignalType, string> = {
  wifi: "WiFi Signal",
  lte: "4G LTE Signal",
  nr: "5G NR Signal",
}

export default function ViewerHeader({
  signal,
  onChange,
  filename,
  quality,
  onQualityChange,
}: {
  signal: SignalType
  onChange: (s: SignalType) => void
  filename?: string | null
  quality?: number
  onQualityChange?: (q: number) => void
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md">
      <div className="flex flex-col gap-1">
        {filename && <span className="text-xs font-medium text-neutral-300">{filename}</span>}
        <span className="text-sm font-semibold">{labels[signal]}</span>
      </div>

      <select
        value={signal}
        onChange={(e) => onChange(e.target.value as SignalType)}
        className="rounded-lg border border-white/10 bg-neutral-900/80 px-3 py-2 text-sm"
      >
        <option value="wifi">WiFi</option>
        <option value="lte">4G LTE</option>
        <option value="nr">5G NR</option>
      </select>

      {typeof quality === "number" && onQualityChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-300">Detail</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={quality}
            onChange={(e) => onQualityChange(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-neutral-300">{quality.toFixed(1)}x</span>
        </div>
      )}
    </div>
  )
}
