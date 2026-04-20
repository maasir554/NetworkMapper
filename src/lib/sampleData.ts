import { RoomHeatmap } from "@/types/heatmap"

export const sampleRoomA: RoomHeatmap = {
  roomName: "Sample Office",
  width: 6,
  height: 4,
  points: [
    { x: 0.4, y: 0.4, wifiRssi: -42 },
    { x: 0.4, y: 2.0, wifiRssi: -45 },
    { x: 0.4, y: 3.6, wifiRssi: -49 },
    { x: 2.0, y: 0.4, wifiRssi: -39 },
    { x: 2.0, y: 2.0, wifiRssi: -50 },
    { x: 2.0, y: 3.6, wifiRssi: -59 },
    { x: 3.6, y: 0.4, wifiRssi: -47 },
    { x: 3.6, y: 2.0, wifiRssi: -62 },
    { x: 3.6, y: 3.6, wifiRssi: -70 },
    { x: 5.2, y: 0.4, wifiRssi: -55 },
    { x: 5.2, y: 2.0, wifiRssi: -68 },
    { x: 5.2, y: 3.6, wifiRssi: -76 },
  ],
}

export const sampleRoomB: RoomHeatmap = {
  roomName: "Sample Corridor",
  width: 10,
  height: 2.5,
  points: [
    { x: 0.4, y: 0.4, wifiRssi: -62 },
    { x: 2.0, y: 0.4, wifiRssi: -59 },
    { x: 4.0, y: 0.4, wifiRssi: -55 },
    { x: 6.0, y: 0.4, wifiRssi: -60 },
    { x: 8.0, y: 0.4, wifiRssi: -66 },
    { x: 0.4, y: 1.7, wifiRssi: -67 },
    { x: 2.0, y: 1.7, wifiRssi: -63 },
    { x: 4.0, y: 1.7, wifiRssi: -58 },
    { x: 6.0, y: 1.7, wifiRssi: -64 },
    { x: 8.0, y: 1.7, wifiRssi: -71 },
  ],
}
