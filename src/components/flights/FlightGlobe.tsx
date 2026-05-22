"use client";

import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";

const AIRPORT_DATA: Record<string, { lat: number; lng: number; name: string }> =
  {
    CCU: { lat: 22.65, lng: 88.44, name: "Kolkata" },
    DEL: { lat: 28.55, lng: 77.1, name: "New Delhi" },
    JFK: { lat: 40.64, lng: -73.77, name: "New York" },
    LHR: { lat: 51.47, lng: -0.45, name: "London" },
    DXB: { lat: 25.25, lng: 55.36, name: "Dubai" },
    BOM: { lat: 19.09, lng: 72.86, name: "Mumbai" },
    SFO: { lat: 37.61, lng: -122.37, name: "San Francisco" },
    NRT: { lat: 35.76, lng: 140.38, name: "Tokyo" },
  };

interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
}

interface FlightGlobeProps {
  originCode: string;
  destinationCode: string;
}

export default function FlightGlobe({
  originCode,
  destinationCode,
}: FlightGlobeProps) {
  const globeRef = useRef<GlobeMethods>(null!);
  const [arcsData, setArcsData] = useState<ArcData[]>([]);

  useEffect(() => {
    const origin = AIRPORT_DATA[originCode];
    const destination = AIRPORT_DATA[destinationCode];

    if (origin && destination) {
      setArcsData([
        {
          startLat: origin.lat,
          startLng: origin.lng,
          endLat: destination.lat,
          endLng: destination.lng,
          color: ["#3b82f6", "#ef4444"],
        },
      ]);

      const midLat = (origin.lat + destination.lat) / 2;
      let midLng = (origin.lng + destination.lng) / 2;

      if (Math.abs(origin.lng - destination.lng) > 180) {
        midLng += 180;
      }

      globeRef.current.pointOfView(
        { lat: midLat, lng: midLng, altitude: 2 },
        1500,
      );
    } else {
      setArcsData([]);
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }
  }, [originCode, destinationCode]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border relative bg-slate-900 flex items-center justify-center">
      <Globe
        ref={globeRef}
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcsTransitionDuration={1000}
        arcStroke={1.5}
      />

      {originCode && destinationCode && (
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/20 z-10">
          {AIRPORT_DATA[originCode]?.name} ✈️{" "}
          {AIRPORT_DATA[destinationCode]?.name}
        </div>
      )}
    </div>
  );
}
