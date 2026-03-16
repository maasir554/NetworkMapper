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
}: {
  signal: SignalType
  onChange: (s: SignalType) => void
  filename?: string | null
  quality?: number
  onQualityChange?: (q: number) => void
}) {
  return (
    <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur px-3 py-2 rounded-lg flex gap-3 items-center">
      <div className="flex flex-col gap-1">
        {filename && (
          <span className="text-xs text-muted-foreground font-medium">{filename}</span>
        )}
        <span className="text-sm font-semibold">{labels[signal]}</span>
      </div>

      <select
        value={signal}
        onChange={(e) => onChange(e.target.value as SignalType)}
        className="bg-neutral-800 text-sm px-2 py-1 rounded"
      >
        <option value="wifi">WiFi</option>
        <option value="lte">4G LTE</option>
        <option value="nr">5G NR</option>
      </select>

      {typeof quality === "number" && onQualityChange && (
        <div className="flex items-center gap-1">
          <span className="text-xs">Q</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={quality}
            onChange={(e) => onQualityChange(Number(e.target.value))}
            className="w-24"
          />
        </div>
      )}
    </div>
  )
}