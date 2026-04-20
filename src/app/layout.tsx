import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Network Mapper",
  description: "Visualize indoor RF coverage, compare datasets, and plan router placement.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
