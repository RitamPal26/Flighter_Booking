"use client"

import { useEffect, useRef } from "react"
import Globe, { type GlobeMethods } from "react-globe.gl"

const AIRPORTS = [
  { lat: 40.64, lng: -73.77, name: "New York" },
  { lat: 51.47, lng: -0.45, name: "London" },
  { lat: 25.25, lng: 55.36, name: "Dubai" },
  { lat: 22.65, lng: 88.44, name: "Kolkata" },
  { lat: 28.55, lng: 77.1, name: "New Delhi" },
  { lat: 19.09, lng: 72.86, name: "Mumbai" },
  { lat: 37.61, lng: -122.37, name: "San Francisco" },
  { lat: 35.76, lng: 140.38, name: "Tokyo" },
  { lat: 1.35, lng: 103.82, name: "Singapore" },
  { lat: 48.85, lng: 2.35, name: "Paris" },
  { lat: 41.26, lng: -95.93, name: "Chicago" },
  { lat: 25.04, lng: 121.56, name: "Taipei" },
]

function generateArcs() {
  const arcs: { startLat: number; startLng: number; endLat: number; endLng: number; color: string[] }[] = []
  const used = new Set<string>()

  for (let i = 0; i < 12; i++) {
    const fromIdx = Math.floor(Math.random() * AIRPORTS.length)
    let toIdx = Math.floor(Math.random() * AIRPORTS.length)
    while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * AIRPORTS.length)

    const key = `${Math.min(fromIdx, toIdx)}-${Math.max(fromIdx, toIdx)}`
    if (used.has(key)) continue
    used.add(key)

    const from = AIRPORTS[fromIdx]
    const to = AIRPORTS[toIdx]

    arcs.push({
      startLat: from.lat,
      startLng: from.lng,
      endLat: to.lat,
      endLng: to.lng,
      color: ["#3b82f6", "#1d4ed8"],
    })
  }

  return arcs
}

export default function MarketingGlobe() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)

  useEffect(() => {
    globeRef.current?.pointOfView?.({ lat: 20, lng: -30, altitude: 2.2 }, 0)
  }, [])

  const arcsData = generateArcs()

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <Globe
        ref={globeRef}
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.2}
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.3}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcsTransitionDuration={0}
        arcStroke={0.8}
        width={1200}
        height={800}
      />
    </div>
  )
}
