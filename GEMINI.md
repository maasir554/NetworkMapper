# RF Heatmap Portal

A comprehensive web application for visualizing, analyzing, and planning RF (Radio Frequency) signal coverage (Wi-Fi, LTE, 5G) in indoor environments.

## Project Overview

The **RF Heatmap Portal** provides a suite of tools for network engineers and floor planners to:
- **Visualize Signal Coverage:** 3D heatmap rendering using Three.js (via React Three Fiber).
- **Dataset Comparison:** Side-by-side analysis of different signal captures or simulated environments.
- **Floor Planning:** A specialized tool to layout rooms, define boundaries, and simulate router placement.
- **Signal Insights:** Detailed analysis of RSSI/RSRP values across different signal types.

### Core Technologies
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **3D Rendering:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) & [Drei](https://docs.pmnd.rs/drei)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Components:** [Radix UI](https://www.radix-ui.com/) primitives
- **Icons:** [Lucide React](https://lucide.dev/)

## Project Structure

```text
src/
├── app/              # Next.js App Router pages and layouts
│   ├── floor-planner/# Floor planning workspace
│   ├── viewer/       # Specialized heatmap viewer
│   └── page.tsx      # Main workspace entry point (Network, Compare, Planner views)
├── components/       # React components
│   ├── floor/        # Specialized floor planner components (Canvas, Toolbar, Sidebar)
│   ├── ui/           # Shared UI primitives (Buttons, Cards, etc.)
│   ├── HeatmapScene.tsx # Main 3D visualization scene
│   └── ...           # Domain-specific components
├── lib/              # Business logic and utilities
│   ├── heatmapParser.ts # Normalizing raw signal data into RoomHeatmap format
│   ├── floorMath.ts     # Geometric calculations for floor planning
│   ├── interpolate.ts   # Signal interpolation logic (e.g., IDW)
│   └── ...
├── store/            # Zustand stores
│   ├── useDataset.ts    # Global state for uploaded heatmaps and comparison mode
│   └── useFloorPlan.ts  # State for floors, rooms, and editor settings
└── types/            # TypeScript domain models and interfaces
    └── heatmap.ts       # Definitions for SignalPoint and RoomHeatmap
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm, yarn, or pnpm

### Commands
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server at `http://localhost:3000` |
| `npm run build` | Builds the project for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint to check for code quality issues |

## Development Conventions

- **State Management:** Use Zustand for global application state. Stores are located in `src/store`.
- **Styling:** Use Tailwind CSS utility classes. Avoid custom CSS unless necessary (available in `src/app/globals.css`).
- **3D Components:** Keep Three.js logic within dedicated components using `@react-three/fiber` hooks (`useFrame`, etc.).
- **Data Normalization:** All signal data should be passed through `normalizeRoomHeatmap` in `src/lib/heatmapParser.ts` to ensure consistency.
- **Type Safety:** Ensure all new domain models are defined in `src/types`. Use strict TypeScript where possible.

## Key Data Models

### RoomHeatmap
The primary data structure for signal data:
```typescript
export type RoomHeatmap = {
  roomName: string
  width: number   // meters
  height: number  // meters
  points: SignalPoint[]
  validAreas?: { x: number; y: number; width: number; height: number }[]
}
```

### SignalPoint
```typescript
export type SignalPoint = {
  x: number
  y: number
  z?: number
  wifiRssi?: number
  lteRsrp?: number
  nrRsrp?: number
}
```
