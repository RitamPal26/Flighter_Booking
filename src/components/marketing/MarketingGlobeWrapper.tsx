"use client"

import dynamic from "next/dynamic"

const MarketingGlobe = dynamic(() => import("./MarketingGlobe"), {
  ssr: false,
  loading: () => null,
})

export default function MarketingGlobeWrapper() {
  return <MarketingGlobe />
}
