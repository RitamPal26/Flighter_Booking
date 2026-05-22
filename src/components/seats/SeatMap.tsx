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
  const pendingSeatId = useFlightStore((state) => state.pendingSeatId);
  const setSelectedSeatId = useFlightStore((state) => state.setSelectedSeatId);
  const setPendingSeatId = useFlightStore((state) => state.setPendingSeatId);
  const rollbackSeatSelection = useFlightStore((state) => state.rollbackSeatSelection);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSeatClick = (seat: Seat) => {
    if (!seat.is_available) return
    setPendingSeatId(seat.id)
    setTimeout(() => {
      setSelectedSeatId(seat.id)
      setPendingSeatId(null)
    }, 400)
  }

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
          setSeats((currentSeats) => {
            const updated = currentSeats.map((seat) =>
              seat.id === updatedSeat.id ? updatedSeat : seat,
            )
            if (!updatedSeat.is_available && selectedSeatId === updatedSeat.id) {
              rollbackSeatSelection(null)
              setPendingSeatId(null)
            }
            return updated
          })
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFlight, supabase, selectedSeatId, rollbackSeatSelection, setPendingSeatId]);

  if (!selectedFlight) return null;
  if (isLoading)
    return <div className="text-center p-8">Loading cabin map...</div>;

  const getRowNum = (seatNumber: string) => parseInt(seatNumber.replace(/[A-F]/g, ""), 10)

  const getSeatColor = (seat: Seat) => {
    if (pendingSeatId === seat.id)
      return "bg-yellow-400 hover:bg-yellow-500 text-white animate-pulse";
    if (selectedSeatId === seat.id)
      return "bg-green-500 hover:bg-green-600 text-white";
    if (!seat.is_available)
      return "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50";

    if (seat.class === "first")
      return "bg-purple-200 hover:bg-purple-300 border-purple-400 text-purple-900";
    if (seat.class === "business")
      return "bg-sky-200 hover:bg-sky-300 border-sky-400 text-sky-900";
    return "bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800";
  };

  const classLabel: Record<string, string> = {
    first: "First Class",
    business: "Business Class",
    economy: "Economy Class",
  }

  const classTheme: Record<string, string> = {
    first: "border-purple-400 bg-purple-100 text-purple-900",
    business: "border-sky-400 bg-sky-100 text-sky-900",
    economy: "border-stone-300 bg-stone-100 text-stone-800",
  }

  const colHeaders = ["A", "B", "C", "", "D", "E", "F"]

  const seatsByClass: Record<string, Seat[]> = { first: [], business: [], economy: [] }
  seats.forEach((s) => seatsByClass[s.class].push(s))

  const classOrder = ["first", "business", "economy"]

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
            <div className="w-4 h-4 bg-purple-300 border border-purple-400 rounded"></div> First
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-sky-300 border border-sky-400 rounded"></div> Business
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-stone-200 border border-stone-300 rounded"></div> Economy
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div> Selected
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div> Selecting
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div> Occupied
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[600px] space-y-6">
            {classOrder.map((cls) => {
              const clsSeats = seatsByClass[cls]
              if (clsSeats.length === 0) return null
              const startRow = getRowNum(clsSeats[0].seat_number)
              const endRow = getRowNum(clsSeats[clsSeats.length - 1].seat_number)

              return (
                <div key={cls}>
                  <div className={`border-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3 ${classTheme[cls]}`}>
                    {classLabel[cls]} &middot; Rows {startRow}&ndash;{endRow}
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center items-center justify-items-center">
                    {colHeaders.map((col, i) => (
                      <div key={i} className="font-bold text-gray-400 text-xs w-10">
                        {col}
                      </div>
                    ))}
                    {clsSeats.map((seat, idx) => {
                      const isAisleNext = (idx + 1) % 6 === 3

                      return (
                        <div key={seat.id} className="contents">
                          <Button
                            variant="outline"
                            disabled={!seat.is_available || pendingSeatId !== null}
                            onClick={() => handleSeatClick(seat)}
                            className={`w-11 h-11 p-0 relative group transition-all duration-200 text-xs ${getSeatColor(seat)}`}
                            title={`${seat.class.toUpperCase()} - Extra Fee: $${seat.extra_fee}`}
                          >
                            {getRowNum(seat.seat_number)}
                          </Button>
                          {isAisleNext && <div className="w-6"></div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
