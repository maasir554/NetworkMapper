"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function HoverInfo({ meshRef }: { meshRef: React.RefObject<THREE.Mesh | null> }) {
  const { camera, raycaster, mouse } = useThree()
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const cursorPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      cursorPosRef.current = { x: event.clientX, y: event.clientY }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    if (!tooltipRef.current) {
      const div = document.createElement("div")
      div.style.position = "fixed"
      div.style.pointerEvents = "none"
      div.style.zIndex = "50"
      div.className = "rounded bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white"
      document.body.appendChild(div)
      tooltipRef.current = div
    }

    return () => {
      if (tooltipRef.current?.parentNode) {
        tooltipRef.current.parentNode.removeChild(tooltipRef.current)
        tooltipRef.current = null
      }
    }
  }, [])

  useFrame(() => {
    if (!meshRef.current) return

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(meshRef.current)
    const tooltip = tooltipRef.current
    if (!tooltip) return

    if (intersects.length === 0) {
      tooltip.style.display = "none"
      return
    }

    const hit = intersects[0]
    const valuesAttr = meshRef.current.geometry?.getAttribute?.("signalValue")
    const face = hit.face
    const localPoint = meshRef.current.worldToLocal(hit.point.clone())
    let signalText = "n/a"

    if (valuesAttr && face) {
      const sampled =
        (valuesAttr.getX(face.a) + valuesAttr.getX(face.b) + valuesAttr.getX(face.c)) / 3
      signalText = `${sampled.toFixed(1)} dBm`
    }

    tooltip.style.display = "block"
    tooltip.style.left = `${cursorPosRef.current.x + 10}px`
    tooltip.style.top = `${cursorPosRef.current.y + 10}px`
    tooltip.innerHTML = `
      <div>X: ${localPoint.x.toFixed(2)} m</div>
      <div>Y: ${localPoint.z.toFixed(2)} m</div>
      <div>Signal: ${signalText}</div>
      <div>Surface: ${localPoint.y.toFixed(2)} m</div>
    `
  })

  return null
}
