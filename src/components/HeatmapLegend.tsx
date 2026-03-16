"use client"

import { Card } from "./ui/card";

export default function HeatmapLegend() {
  // keep the data points in case we ever want to render ticks dynamically
  const stops = [
    { value: -90, label: "-90 dBm" },
    { value: -80, label: "-80 dBm" },
    { value: -70, label: "-70 dBm" },
    { value: -60, label: "-60 dBm" },
    { value: -50, label: "-50 dBm" },
  ];

  return (
    <Card className="absolute left-6 bottom-6 z-10 p-4 bg-card/70 backdrop-blur shadow-xl border">
      <h3 className="mb-2 font-semibold text-sm">Signal strength</h3>

      {/* a single div using a tailwind gradient produces a smooth colored bar */}
      <div className="h-3 w-64 rounded-md mb-2 bg-linear-to-r from-red-500 via-yellow-400 to-green-500" />

      <div className="flex justify-between text-xs text-muted-foreground">
        {stops.map((s) => (
          <span key={s.value}>{s.label}</span>
        ))}
      </div>
    </Card>
  );
}