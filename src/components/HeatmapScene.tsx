"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { useState, useEffect } from "react"
import { SignalType } from "@/store/useDataset"
import { RoomHeatmap } from "@/types/heatmap"
import HeatmapLegend from "./HeatmapLegend"
import HeatmapSurface from "./HeatmapSurface"
import RouterMarkers3D from "./RouterMarkers3D"
import SignalInsights from "./SignalInsights"
import ViewerHeader from "./ViewerHeader"
import { RouterMarker, buildRouterMarkersForDataset } from "@/lib/routerPlanning"

function WebGLFallback({ filename }: { filename?: string | null }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-white text-black">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-xl font-semibold">3D Viewer Unavailable</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          WebGL is not supported in this browser or environment. This may happen in:
        </p>
        <ul className="text-xs text-gray-500 space-y-1 text-left">
          <li>• Virtual machines without GPU acceleration</li>
          <li>• Browsers with WebGL disabled</li>
          <li>• Outdated graphics drivers</li>
          <li>• Headless environments</li>
        </ul>
        <p className="text-sm text-gray-400 mt-4">
          {filename ? `Dataset "${filename}" loaded successfully.` : "No dataset loaded."}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Try using a different browser or enabling hardware acceleration in your browser settings.
        </p>
      </div>
    </div>
  )
}

export default function HeatmapScene({
  initialSignal,
  dataset,
  filename,
  routerMarkers = [],
  hideInsights = false,
}: {
  initialSignal: SignalType
  dataset: RoomHeatmap | null
  filename?: string | null
  routerMarkers?: RouterMarker[]
  hideInsights?: boolean
}) {
  const [signal, setSignal] = useState<SignalType>(initialSignal)
  const [quality, setQuality] = useState(0.7)
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setWebglSupported(!!gl)
    } catch (e) {
      setWebglSupported(false)
    }
  }, [])

  const defaultMarkers = dataset && signal === "wifi" ? buildRouterMarkersForDataset(dataset, signal, "room", filename ?? dataset.roomName) : []
  const markers = routerMarkers.length > 0 ? routerMarkers : defaultMarkers

  const roomWidth = dataset?.width ?? 6
  const roomHeight = dataset?.height ?? 6
  const maxDim = Math.max(roomWidth, roomHeight)
  const camDistance = maxDim * 1.5 + 3
  const camY = maxDim * 0.4 + 2
  const farPlane = camDistance * 10
  const gridSize = Math.max(roomWidth, roomHeight)
  const gridDivisions = Math.max(Math.round(gridSize * 2), 12)

  if (webglSupported === false) {
    return (
      <div className="relative h-full min-h-[150px] w-full overflow-hidden rounded-xl">
        <ViewerHeader
          signal={signal}
          onChange={setSignal}
          filename={filename}
          quality={quality}
          onQualityChange={setQuality}
        />
        <WebGLFallback filename={filename} />
        <SignalInsights
          dataset={dataset}
          signal={signal}
          routerMarkers={signal === "wifi" ? routerMarkers : []}
          overlay
        />
        <HeatmapLegend signal={signal} />
      </div>
    )
  }

  if (webglSupported === null) {
    return (
      <div className="relative h-full min-h-[150px] w-full overflow-hidden rounded-xl bg-white flex items-center justify-center">
        <div className="text-white text-sm">Checking WebGL support...</div>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[150px] w-full overflow-hidden rounded-xl">
      <ViewerHeader
        signal={signal}
        onChange={setSignal}
        filename={filename}
        quality={quality}
        onQualityChange={setQuality}
      />

      <div className="absolute inset-0">
        <Canvas
          dpr={1}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          camera={{
            position: [camDistance, camY, camDistance],
            fov: 50,
            near: 0.1,
            far: farPlane,
          }}
        >
          <ambientLight intensity={0.62} />
          <directionalLight position={[5, 12, 5]} intensity={2.1} />
          <directionalLight position={[-5, 10, -5]} intensity={0.85} />
          <color attach="background" args={["#fcfcfd"]} />
          <fog attach="fog" args={["#fcfcfd", camDistance * 1.2, farPlane * 0.55]} />

          <gridHelper
            args={[gridSize, gridDivisions, "#94a3b8", "#cbd5e1"]}
            position={[0, 0.01, 0]}
          />

          <HeatmapSurface dataset={dataset} signal={signal} quality={quality} />
          <RouterMarkers3D dataset={dataset} markers={signal === "wifi" ? routerMarkers : []} />

          <OrbitControls
            target={[0, 0, 0]}
            minDistance={3}
            maxDistance={camDistance * 5}
          />
        </Canvas>
      </div>

      <HeatmapLegend signal={signal} />
      {!hideInsights && (
        <SignalInsights
          dataset={dataset}
          signal={signal}
          routerMarkers={signal === "wifi" ? routerMarkers : []}
          overlay
        />
      )}
    </div>
  )
}
