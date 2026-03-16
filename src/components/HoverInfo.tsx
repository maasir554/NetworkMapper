"use client"

import { useThree } from "@react-three/fiber"
import { useState, useEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export default function HoverInfo({ meshRef }: any) {
  const { camera, raycaster, mouse } = useThree()
  const [hoveredPoint, setHoveredPoint] = useState<THREE.Vector3 | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const cursorPosRef = useRef({ x: 0, y: 0 })

  // Track actual mouse position on screen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorPosRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Create/cleanup the tooltip DOM element
  useEffect(() => {
    if (!tooltipRef.current) {
      const div = document.createElement("div")
      div.style.position = "fixed"
      div.style.pointerEvents = "none"
      div.style.zIndex = "50"
      div.className = "bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap"
      document.body.appendChild(div)
      tooltipRef.current = div
    }

    return () => {
      if (tooltipRef.current && tooltipRef.current.parentNode) {
        tooltipRef.current.parentNode.removeChild(tooltipRef.current)
        tooltipRef.current = null
      }
    }
  }, [])

  useFrame(() => {
    if (!meshRef.current) return

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(meshRef.current)

    if (intersects.length > 0) {
      const point = intersects[0].point
      setHoveredPoint(point)

      // Use actual cursor position from mousemove event
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${cursorPosRef.current.x + 10}px`
        tooltipRef.current.style.top = `${cursorPosRef.current.y + 10}px`
        tooltipRef.current.style.display = "block"
        tooltipRef.current.innerHTML = `
          <div>X: ${point.x.toFixed(2)} m</div>
          <div>Y: ${point.z.toFixed(2)} m</div>
          <div>Height: ${point.y.toFixed(2)}</div>
        `
      }
    } else {
      setHoveredPoint(null)
      if (tooltipRef.current) {
        tooltipRef.current.style.display = "none"
      }
    }
  })

  return null
}