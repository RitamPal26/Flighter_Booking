import { WifiOffIcon } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <WifiOffIcon className="size-16 text-gray-300 mx-auto" />
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re Offline</h1>
        <p className="text-muted-foreground">
          Please check your internet connection and try again. Your booking
          information is saved locally and will sync when you reconnect.
        </p>
      </div>
    </div>
  )
}
