export type SignalPoint = {
  x: number
  y: number
  z?: number   // future height support
  wifiRssi?: number
  lteRsrp?: number
  nrRsrp?: number
}

export type RoomHeatmap = {
  roomName: string
  width: number   // meters
  height: number  // meters
  points: SignalPoint[]
  /**
   * Optional rectangles (x,y,width,height) covering the real rooms
   * in a merged dataset. Used to mask interpolation outside those
   * areas when rooms are stitched together.
   */
  validAreas?: { x: number; y: number; width: number; height: number }[]
}