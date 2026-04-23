# AGENTS.md

## Project Overview
Next.js 16 + React 19 + Three.js / @react-three/fiber RF signal heatmap visualizer.
This is a dark mode application that needs conversion to clean light mode.

## Commands
```
npm install      # install dependencies
npm run dev      # start dev server on port 3000
npm run build    # production build
npm run start    # run production server
npm run lint     # run eslint
```

## Structure
- `src/app/` - Next.js App Router pages and global styles
- `src/components/` - UI components + WebGL/Three.js visualization
- `src/lib/` - heatmap interpolation logic
- `src/store/` - application state
- `src/types/` - TypeScript types

## Critical Context for Light Mode Conversion

1. **Global Theming**:
   - All base colors defined at `src/app/globals.css:3-13` using Tailwind `@theme` oklch variables
   - Current values are dark mode. Adjust these first before making component changes

2. **WebGL / Canvas Colors**:
   - Heatmap colors are generated dynamically in `HeatmapSurface.tsx:64-70` using THREE.Color HSL
   - Heatmap mesh uses meshStandardMaterial with roughness 0.38, metalness 0.08
   - Background, floor, lighting, and all 3D elements need light mode adjustment
   - Canvas touch actions are disabled in global CSS

3. **Screenshot Requirements**:
   - Disable user selection globally (`user-select: none` already set)
   - Ensure clean sharp edges, no glows/shadows that don't render cleanly
   - All UI elements must align perfectly without overflow
   - No flickering or artifacts in WebGL canvas

## Conventions
- Uses Tailwind 4
- All components are TypeScript
- "use client" directive required for all interactive / WebGL components
- shadcn/ui components in `src/components/ui/`

## Gotchas
- Next.js 16 uses App Router, no pages directory
- @react-three/fiber v9 / drei v10 - newer API
- Canvas elements are not controlled by Tailwind dark/light classes automatically
- Heatmap vertex colors are calculated in JavaScript, not CSS
- No tests in current repository

## Current Task Priorities
1. Convert all base colors in globals.css to light mode values first
2. Adjust all UI component backgrounds / text / borders
3. Update Three.js scene background, lighting, floor plane, and mesh materials
4. Adjust heatmap color function to look good on light background
5. Verify canvas output is clean for screenshots
