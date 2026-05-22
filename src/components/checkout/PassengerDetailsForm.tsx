"use client"

import { useState } from "react"
import { useFlightStore } from "@/store/flightStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function PassengerDetailsForm() {
  const passengerData = useFlightStore((state) => state.passengerData)
  const setPassengerData = useFlightStore((state) => state.setPassengerData)
  const setStep = useFlightStore((state) => state.setStep)

  const [fullName, setFullName] = useState(passengerData?.fullName ?? "")
  const [passportNo, setPassportNo] = useState(passengerData?.passportNo ?? "")
  const [nationality, setNationality] = useState(passengerData?.nationality ?? "")
  const [dob, setDob] = useState(passengerData?.dob ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !passportNo || !nationality || !dob) return
    setPassengerData({ fullName, passportNo, nationality, dob })
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Passenger Details</CardTitle>
        <CardDescription>
          Enter the primary passenger&apos;s information as it appears on their
          passport.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="passportNo" className="text-sm font-medium">
              Passport Number
            </label>
            <input
              id="passportNo"
              type="text"
              value={passportNo}
              onChange={(e) => setPassportNo(e.target.value)}
              placeholder="AB1234567"
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="nationality" className="text-sm font-medium">
              Nationality
            </label>
            <select
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select nationality</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="IN">India</option>
              <option value="AE">UAE</option>
              <option value="JP">Japan</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="SG">Singapore</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="dob" className="text-sm font-medium">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("seat_selection")}
            >
              Back to Seats
            </Button>
            <Button type="submit" className="flex-1">
              Continue to Payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
