import create from "zustand"
import { RoomHeatmap } from "@/types/heatmap"

export type SignalType = "wifi" | "lte" | "nr"

type DatasetState = {
  // Room datasets
  datasetA: RoomHeatmap | null
  datasetB: RoomHeatmap | null
  filenameA: string | null
  filenameB: string | null

  // Toggle room comparison mode
  compareMode: boolean
  setCompareMode: (v: boolean) => void

  // chosen signal for global floor plan preview
  signal: SignalType
  setSignal: (s: SignalType) => void

  // Upload handlers
  setDatasetA: (data: RoomHeatmap, filename: string) => void
  setDatasetB: (data: RoomHeatmap, filename: string) => void

  // Optional helpers
  clearAll: () => void
}

export const useDataset = create<DatasetState>((set) => ({
  datasetA: null,
  datasetB: null,
  filenameA: null,
  filenameB: null,

  compareMode: false,
  setCompareMode: (v) => set({ compareMode: v }),

  // default signal
  signal: "wifi",
  setSignal: (s) => set({ signal: s }),

  setDatasetA: (data, filename) => set({ datasetA: data, filenameA: filename }),
  setDatasetB: (data, filename) => set({ datasetB: data, filenameB: filename }),

  clearAll: () =>
    set({
      datasetA: null,
      datasetB: null,
      filenameA: null,
      filenameB: null,
    }),
}))