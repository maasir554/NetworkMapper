import create from "zustand"
import { RoomHeatmap } from "@/types/heatmap"
import { nanoid } from "nanoid"

export type FloorRoom = {
  id: string
  name: string

  // position in meters (top-left corner)
  x: number
  y: number

  // room size in meters
  widthM: number
  heightM: number

  dataset?: RoomHeatmap
  showTicks?: boolean  // show/hide tick marks on this room
}

export type Floor = {
  id: string
  name: string
  rooms: FloorRoom[]
}

export type RouterPlanningMode = "per-room" | "whole-floor"

type FloorState = {
  floors: Floor[]
  currentFloorId: string | null

  // pixels per meter (zoom / scale of editor)
  scale: number
  setScale: (v: number) => void

  // camera pan offset (meters)
  offsetX: number
  offsetY: number
  setOffset: (x: number, y: number) => void

  // snap unit: "feet" (0.3048m) or "meters" (1m)
  snapUnit: "feet" | "meters"
  setSnapUnit: (unit: "feet" | "meters") => void

  routerPlanningMode: RouterPlanningMode
  setRouterPlanningMode: (mode: RouterPlanningMode) => void

  // grid snapping increment (meters, 0 = off)
  gridSize: number
  setGridSize: (v: number) => void

  addFloor: (name?: string) => void
  setCurrentFloor: (floorId: string) => void
  deleteFloor: (floorId: string) => void
  renameFloor: (floorId: string, name: string) => void

  addRoom: (widthM?: number, heightM?: number) => void
  updateRoom: (id: string, data: Partial<FloorRoom>) => void
  deleteRoom: (id: string) => void
  selectedRoomIds: string[]
  selectedRoomId: string | null
  toggleRoomSelection: (id: string | null, multi?: boolean) => void
  selectRoom: (id: string) => void
  clearSelection: () => void
  attachDataset: (id: string, dataset: RoomHeatmap) => void
  clearRooms: () => void
  setRooms: (rooms: FloorRoom[]) => void
}

export const useFloorPlan = create<FloorState>((set) => {
  // Initialize with a default floor
  const defaultFloor: Floor = {
    id: nanoid(),
    name: "Floor 1",
    rooms: [],
  }

  return {
    floors: [defaultFloor],
    currentFloorId: defaultFloor.id,

    selectedRoomIds: [],
    selectedRoomId: null,

    // Floor management
    addFloor: (name = "New Floor") =>
      set((state) => {
        const newFloor: Floor = {
          id: nanoid(),
          name,
          rooms: [],
        }
        return {
          floors: [...state.floors, newFloor],
          currentFloorId: newFloor.id,
        }
      }),

    setCurrentFloor: (floorId) =>
      set((state) => {
        // Verify floor exists before switching
        if (state.floors.some((f) => f.id === floorId)) {
          return { currentFloorId: floorId, selectedRoomIds: [], selectedRoomId: null }
        }
        return state
      }),

    deleteFloor: (floorId) =>
      set((state) => {
        const filtered = state.floors.filter((f) => f.id !== floorId)
        // If we deleted the current floor, switch to the first remaining floor
        const newCurrentFloorId =
          state.currentFloorId === floorId && filtered.length > 0
            ? filtered[0].id
            : state.currentFloorId === floorId
              ? null
              : state.currentFloorId

        return {
          floors: filtered,
          currentFloorId: newCurrentFloorId,
          selectedRoomIds: [],
          selectedRoomId: null,
        }
      }),

    renameFloor: (floorId, name) =>
      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === floorId ? { ...f, name } : f
        ),
      })),

    toggleRoomSelection: (id, multi = false) =>
      set((state) => {
        if (!multi) {
          return { selectedRoomIds: id ? [id] : [], selectedRoomId: id }
        }

        if (!id) {
          // nothing to toggle when null in multi mode
          return state
        }

        const exists = state.selectedRoomIds.includes(id)

        return {
          selectedRoomIds: exists
            ? state.selectedRoomIds.filter((r) => r !== id)
            : [...state.selectedRoomIds, id],
          selectedRoomId: id,
        }
      }),

    selectRoom: (id) =>
      set(() => ({ selectedRoomIds: [id], selectedRoomId: id })),

    clearSelection: () => set({ selectedRoomIds: [], selectedRoomId: null }),

    // pixels per meter (zoom / scale of editor)
    // 1 meter = 60px (great default for floor planning)
    scale: 60,
    setScale: (v) => {
      const clamped = Math.min(Math.max(v, 5), 500) // limit zoom between ~0.08x and ~8x default
      set({ scale: clamped })
    },

    // camera offset (in meters)
    offsetX: 0,
    offsetY: 0,
    setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

    // snap unit: "feet" (0.3048m) or "meters" (1m)
    snapUnit: "feet",
    setSnapUnit: (unit) => set({ snapUnit: unit }),

    routerPlanningMode: "whole-floor",
    setRouterPlanningMode: (mode) => set({ routerPlanningMode: mode }),

    // grid snapping increment (meters) - 1 foot = 0.3048m
    gridSize: 0.3048,
    setGridSize: (v) => set({ gridSize: v }),

    /*
      Add new room with real world dimensions to the current floor
      Default room = 4m x 3m
    */
    addRoom: (widthM = 4, heightM = 3) =>
      set((state) => {
        // Find current floor
        const currentFloor = state.floors.find((f) => f.id === state.currentFloorId)
        if (!currentFloor) return state

        // find a starting position that doesn't collide with existing rooms on this floor
        const collidesWith = (x: number, y: number) =>
          currentFloor.rooms.some(
            (r) =>
              x < r.x + r.widthM &&
              x + widthM > r.x &&
              y < r.y + r.heightM &&
              y + heightM > r.y
          )

        let x = 1
        const y = 1
        while (collidesWith(x, y)) {
          // move right by one meter until we find a free spot
          x += widthM + 1
        }

        const newRoom: FloorRoom = {
          id: nanoid(),
          name: `Room ${currentFloor.rooms.length + 1}`,
          x,
          y,
          widthM,
          heightM,
        }

        return {
          floors: state.floors.map((f) =>
            f.id === state.currentFloorId
              ? { ...f, rooms: [...f.rooms, newRoom] }
              : f
          ),
        }
      }),

    updateRoom: (id, data) =>
      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === state.currentFloorId
            ? {
                ...f,
                rooms: f.rooms.map((r) =>
                  r.id === id ? { ...r, ...data } : r
                ),
              }
            : f
        ),
      })),

    deleteRoom: (id) =>
      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === state.currentFloorId
            ? { ...f, rooms: f.rooms.filter((r) => r.id !== id) }
            : f
        ),
        selectedRoomIds: state.selectedRoomIds.filter((rid) => rid !== id),
        selectedRoomId: state.selectedRoomId === id ? null : state.selectedRoomId,
      })),

    attachDataset: (id, dataset) =>
      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === state.currentFloorId
            ? {
                ...f,
                rooms: f.rooms.map((r) =>
                  r.id === id ? { ...r, dataset } : r
                ),
              }
            : f
        ),
      })),

    clearRooms: () =>
      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === state.currentFloorId ? { ...f, rooms: [] } : f
        ),
        selectedRoomIds: [],
        selectedRoomId: null,
      })),

    setRooms: (rooms) =>
      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === state.currentFloorId ? { ...f, rooms } : f
        ),
      })),
  }
})
