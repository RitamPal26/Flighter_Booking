"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFlightStore } from "@/store/flightStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { flightService } from "@/lib/supabase/queries";
import type { Seat } from "@/types/supabase";

export default function SeatMap() {
  const supabase = createClient();
  const selectedFlight = useFlightStore((state) => state.selectedFlight);
  const selectedSeatId = useFlightStore((state) => state.selectedSeatId);
  const setSelectedSeatId = useFlightStore((state) => state.setSelectedSeatId);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedFlight) return;

    const fetchSeats = async () => {
      const { data, error } = await flightService.getCabinMap(
        selectedFlight.id,
      );

      if (!error && data) {
        setSeats(data as Seat[]);
      }
      setIsLoading(false);
    };

    fetchSeats();

    // Keep createClient here as Realtime subscriptions are not easily abstracted into static service calls
    const channel = supabase
      .channel("seat_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "seats",
          filter: `flight_id=eq.${selectedFlight.id}`,
        },
        (payload) => {
          const updatedSeat = payload.new as Seat;
          setSeats((currentSeats) =>
            currentSeats.map((seat) =>
              seat.id === updatedSeat.id ? updatedSeat : seat,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFlight, supabase]);

  if (!selectedFlight) return null;
  if (isLoading)
    return <div className="text-center p-8">Loading cabin map...</div>;

  const getSeatColor = (seat: Seat) => {
    if (selectedSeatId === seat.id)
      return "bg-green-500 hover:bg-green-600 text-white";
    if (!seat.is_available)
      return "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50";

    if (seat.class === "first")
      return "bg-purple-100 hover:bg-purple-200 border-purple-300";
    if (seat.class === "business")
      return "bg-blue-100 hover:bg-blue-200 border-blue-300";
    return "bg-white hover:bg-gray-100 border-gray-200";
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 border-2 border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Select Your Seat</span>
          <span className="text-sm font-normal text-gray-500">
            Flight {selectedFlight.flight_no}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-8 text-sm justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border rounded"></div> First
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border rounded"></div> Business
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border rounded"></div> Economy
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div> Selected
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div> Occupied
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[600px] grid grid-cols-7 gap-3 text-center items-center justify-items-center">
            {["A", "B", "C", "", "D", "E", "F"].map((col, i) => (
              <div key={i} className="font-bold text-gray-400 w-10">
                {col}
              </div>
            ))}

            {seats.map((seat, index) => {
              const isAisleNext = (index + 1) % 6 === 3;

              return (
                <div key={seat.id} className="contents">
                  <Button
                    variant="outline"
                    disabled={!seat.is_available}
                    onClick={() => setSelectedSeatId(seat.id)}
                    className={`w-12 h-12 p-0 relative group transition-all duration-200 ${getSeatColor(seat)}`}
                    title={`${seat.class.toUpperCase()} - Extra Fee: $${seat.extra_fee}`}
                  >
                    {seat.seat_number.replace(/[A-F]/g, "")}{" "}
                  </Button>

                  {isAisleNext && <div className="w-8"></div>}
                </div>
              );
            })}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
