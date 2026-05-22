"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<Event | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    const promptEvent = deferredPrompt as unknown as { prompt: () => void; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
    promptEvent.prompt()

    const result = await promptEvent.userChoice
    if (result.outcome === "accepted") {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-50 bg-white border rounded-xl shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">Install Flighter</p>
          <p className="text-xs text-muted-foreground">
            Add to your home screen for a faster experience.
          </p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XIcon className="size-4" />
        </button>
      </div>
      <Button className="w-full" size="sm" onClick={handleInstall}>
        Install App
      </Button>
    </div>
  )
}
