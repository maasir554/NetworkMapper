"use client"

import { useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid } from "@react-three/drei"
import HeatmapSurface from "./HeatmapSurface"
import HeatmapLegend from "./HeatmapLegend"
import ViewerHeader from "./ViewerHeader"
import { SignalType } from "@/store/useDataset"
import { RoomHeatmap } from "@/types/heatmap"

export default function HeatmapScene({
  initialSignal,
  dataset,
  filename,
}: {
  initialSignal: SignalType
  dataset: RoomHeatmap | null
  filename?: string | null
}) {
  const [signal, setSignal] = useState<SignalType>(initialSignal)
  const [quality, setQuality] = useState(1) // multiplier for adaptive resolution

  // fallback room size before upload
  const roomWidth = dataset?.width ?? 6
  const roomHeight = dataset?.height ?? 6

  const maxDim = Math.max(roomWidth, roomHeight)
  const camDistance = maxDim * 1.5 + 3
  const camY = maxDim * 0.4 + 2
  const farPlane = camDistance * 10

  return (
    <div className="relative w-full h-full min-h-[150] rounded-xl overflow-hidden">

      {/* Panel header (signal selector per panel) */}
      <ViewerHeader
        signal={signal}
        onChange={setSignal}
        filename={filename}
        quality={quality}
        onQualityChange={setQuality}
      />

      <div className="absolute inset-0">
        <Canvas
          camera={{
            position: [camDistance, camY, camDistance],
            fov: 50,
            near: 0.1,
            far: farPlane,
          }}
        >
          <ambientLight intensity={0.35} />
          <directionalLight position={[5, 12, 5]} intensity={1.4} />
          <directionalLight position={[-5, 10, -5]} intensity={0.5} />

          <Grid
            args={[roomWidth, roomHeight]}
            cellSize={0.5}
            sectionSize={1}
            infiniteGrid={false}
          />

          {/* 🔥 PASS DATASET DOWN */}
          <HeatmapSurface dataset={dataset} signal={signal} quality={quality} />

          <OrbitControls
            target={[0, 0, 0]}
            minDistance={3}
            maxDistance={camDistance * 5}
          />
        </Canvas>
      </div>

      <HeatmapLegend />
    </div>
  )
}