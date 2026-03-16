"use client"

import { useDataset } from "@/store/useDataset"
import { Button } from "@/components/ui/button"

export default function SignalToggle() {
  const signalType = useDataset((s) => s.signalType)
  const setSignalType = useDataset((s) => s.setSignalType)

  const options = [
    { key: "wifi", label: "WiFi" },
    { key: "lte", label: "4G LTE" },
    { key: "nr", label: "5G NR" },
  ] as const

  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <Button
          key={o.key}
          variant={signalType === o.key ? "default" : "secondary"}
          onClick={() => setSignalType(o.key)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}