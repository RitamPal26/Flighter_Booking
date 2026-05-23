"use client"

import { useState } from "react"
import { useFlightStore } from "@/store/flightStore"
import type { PassengerDetails } from "@/store/flightStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface PassengerForm {
  fullName: string
  passportNo: string
  nationality: string
  dob: string
}

export default function PassengerDetailsForm() {
  const passengersData = useFlightStore((state) => state.passengersData)
  const setPassengersData = useFlightStore((state) => state.setPassengersData)
  const selectedSeatIds = useFlightStore((state) => state.selectedSeatIds)
  const setStep = useFlightStore((state) => state.setStep)

  const count = selectedSeatIds.length

  const [forms, setForms] = useState<PassengerForm[]>(() => {
    if (passengersData.length === count && passengersData.length > 0) {
      return passengersData.map((p) => ({
        fullName: p.fullName,
        passportNo: p.passportNo,
        nationality: p.nationality,
        dob: p.dob,
      }))
    }
    return Array.from({ length: count }, () => ({
      fullName: "",
      passportNo: "",
      nationality: "",
      dob: "",
    }))
  })

  const updateForm = (index: number, field: keyof PassengerForm, value: string) => {
    setForms((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const allValid = forms.every((f) => f.fullName && f.passportNo && f.nationality && f.dob)
    if (!allValid) return
    setPassengersData(forms as PassengerDetails[])
  }

  if (count === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="p-6 text-center text-muted-foreground">
          No seats selected. Please go back and select seats.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Passenger Details</CardTitle>
        <CardDescription>
          Enter details for {count} passenger{count > 1 ? "s" : ""} as they appear on their passports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {forms.map((form, i) => (
            <div key={i} className="space-y-4 border rounded-lg p-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Passenger {i + 1}
              </h3>

              <div className="space-y-2">
                <label htmlFor={`fullName-${i}`} className="text-sm font-medium">
                  Full Name
                </label>
                <input
                  id={`fullName-${i}`}
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateForm(i, "fullName", e.target.value)}
                  placeholder="John Doe"
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor={`passportNo-${i}`} className="text-sm font-medium">
                  Passport Number
                </label>
                <input
                  id={`passportNo-${i}`}
                  type="text"
                  value={form.passportNo}
                  onChange={(e) => updateForm(i, "passportNo", e.target.value)}
                  placeholder="AB1234567"
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor={`nationality-${i}`} className="text-sm font-medium">
                  Nationality
                </label>
                <select
                  id={`nationality-${i}`}
                  value={form.nationality}
                  onChange={(e) => updateForm(i, "nationality", e.target.value)}
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
                <label htmlFor={`dob-${i}`} className="text-sm font-medium">
                  Date of Birth
                </label>
                <input
                  id={`dob-${i}`}
                  type="date"
                  value={form.dob}
                  onChange={(e) => updateForm(i, "dob", e.target.value)}
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          ))}

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
