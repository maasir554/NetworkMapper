"use client"

import { Button } from "@/components/ui/button"
import { useDataset } from "@/store/useDataset"

export default function SignalToggle() {
  const signal = useDataset((s) => s.signal)
  const setSignal = useDataset((s) => s.setSignal)

  const options = [
    { key: "wifi", label: "WiFi" },
    { key: "lte", label: "4G LTE" },
    { key: "nr", label: "5G NR" },
  ] as const

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button
          key={option.key}
          variant={signal === option.key ? "default" : "secondary"}
          onClick={() => setSignal(option.key)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
