"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useFlightStore } from "@/store/flightStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Flight } from "@/types/supabase";
import SearchForm from "./SearchForm";
import SeatMap from "@/components/seats/SeatMap";
import CheckoutDialog from "@/components/checkout/CheckoutDialog";
import PassengerDetailsForm from "@/components/checkout/PassengerDetailsForm";
import ConfirmationView from "@/components/notifications/ConfirmationView";
import { formatTime, formatCurrency } from "@/utils/formatters";

const FlightGlobe = dynamic(() => import("./FlightGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-900 rounded-xl animate-pulse flex items-center justify-center text-slate-500">
      Loading Map...
    </div>
  ),
});

export default function FlightDashboard() {
  const [flights, setFlights] = useState<Flight[]>([]);

  const currentStep = useFlightStore((state) => state.currentStep);
  const searchQuery = useFlightStore((state) => state.searchQuery);
  const setSelectedFlight = useFlightStore((state) => state.setSelectedFlight);
  const resetBooking = useFlightStore((state) => state.resetBooking);
  const bookingResult = useFlightStore((state) => state.bookingResult);

  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    toast("Flight Selected", {
      description: `Proceeding to seat selection for ${flight.flight_no}.`,
    });
  };

  if (currentStep === "confirmation") {
    if (bookingResult) {
      return <ConfirmationView />;
    }
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-4 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={resetBooking}>
          &larr; Back to Search
        </Button>
        <CheckoutDialog />
      </div>
    );
  }

  if (currentStep === "seat_selection") {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-4 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={resetBooking}>
          &larr; Back to Search
        </Button>
        <SeatMap />
      </div>
    );
  }

  if (currentStep === "passenger_details") {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-4 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={resetBooking}>
          &larr; Back to Search
        </Button>
        <PassengerDetailsForm />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
        <div className="h-auto lg:h-[400px] flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Find Your Flight
            </h1>
            <p className="text-gray-500">
              Search and book flights instantly with real-time seat
              availability.
            </p>
          </div>

          <SearchForm onResultsFound={setFlights} />
        </div>

        <div className="hidden lg:block h-[400px] w-full">
          <FlightGlobe
            originCode={searchQuery?.origin || ""}
            destinationCode={searchQuery?.destination || ""}
          />
        </div>
      </div>

      {flights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Flights</h2>
          <div className="grid gap-4">
            {flights.map((flight) => (
              <Card
                key={flight.id}
                className="hover:border-blue-500 transition-colors"
              >
                <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
                  <div className="w-24 text-center md:text-left">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {flight.flight_no}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {flight.aircraft_type}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-1 justify-center">
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatTime(flight.departs_at)}
                      </p>
                      <p className="text-sm text-gray-500">{flight.origin}</p>
                    </div>
                    <div className="w-16 border-t-2 border-dashed border-gray-300 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-400">
                        Direct
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xl font-bold">
                        {formatTime(flight.arrives_at)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {flight.destination}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end w-full md:w-auto mt-4 md:mt-0">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(flight.base_price)}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">per passenger</p>
                    <Button onClick={() => handleSelectFlight(flight)}>
                      Select Seat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
