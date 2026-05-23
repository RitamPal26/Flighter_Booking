"use client";

import { useEffect, useState } from "react";
import { useFlightStore } from "@/store/flightStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { flightService } from "@/lib/supabase/queries";
import type { Flight } from "@/types/supabase";
import LocationAutocomplete from "./LocationAutocomplete";

export default function SearchForm({
  onResultsFound,
}: {
  onResultsFound: (flights: Flight[]) => void;
}) {
  const setSearchQuery = useFlightStore((state) => state.setSearchQuery);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [dateRange, setDateRange] = useState({ min: "", max: "" });

  useEffect(() => {
    flightService.getFlightDateRange().then(({ data, error }) => {
      if (!error && data) {
        const r = data as { min_date: number; max_date: number };
        setDateRange({
          min: r.min_date ? new Date(r.min_date).toISOString().slice(0, 10) : "",
          max: r.max_date ? new Date(r.max_date).toISOString().slice(0, 10) : "",
        });
      }
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    if (!origin || !destination) {
      toast.error("Missing fields", {
        description: "Please select an origin and destination.",
      });
      setIsSearching(false);
      return;
    }

    setSearchQuery({ origin, destination, date, passengers });

    const { data, error } = await flightService.searchFlights(
      origin,
      destination,
      date || undefined,
    );

    if (error) {
      toast.error("Search Failed", { description: error.message });
    } else {
      onResultsFound(data || []);
      if (data?.length === 0)
        toast("No flights found", {
          description: "Try DEL to BOM or CCU to DEL.",
        });
    }

    setIsSearching(false);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Flight Details</CardTitle>
        <CardDescription>
          Enter your travel information to see available routes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* CHANGED: md:grid-cols-4 to sm:grid-cols-2 */}
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Origin</label>
            <LocationAutocomplete
              value={origin}
              onChange={setOrigin}
              placeholder="Select origin"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination</label>
            <LocationAutocomplete
              value={destination}
              onChange={setDestination}
              placeholder="Select destination"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={dateRange.min}
              max={dateRange.max}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Passengers</label>
            <Input
              type="number"
              min="1"
              max="9"
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              required
            />
          </div>
          {/* CHANGED: md:col-span-4 to sm:col-span-2 so the button spans full width */}
          <div className="sm:col-span-2 flex justify-end mt-4">
            <Button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto px-8"
            >
              {isSearching ? "Searching..." : "Search Flights"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
