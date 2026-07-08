import {
  TIME_SLOTS,
  TABLES,
  getReservationAtSlot,
} from "@/lib/reservationUtils";
import ReservationCell from "./ReservationCell";

const FILTER_MAP = {
  Reserved: "Reserved",
  "Checked-in": "CheckedIn",
  Completed: "Completed",
  "No Show": "NoShow",
  "Walk-in": "WalkIn",
};

export default function ReservationGrid({
  reservations,
  selectedDate,
  currentTime,
  filter,
  searchQuery,
  loading,
  onSelectReservation,
  onCellClick,
}) {
  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  const showTimeline = currentHour >= 11 && currentHour <= 19;
  const timelinePercent = ((currentHour - 11) / 8) * 100;

  const isDimmed = (reservation) => {
    if (!reservation) return false;
    if (filter !== "All" && filter !== "Today") {
      const targetStatus = FILTER_MAP[filter];
      if (targetStatus && reservation.status !== targetStatus) return true;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !reservation.customerName?.toLowerCase().includes(q) &&
        !reservation.phone?.includes(q) &&
        !String(reservation.tableNumber).includes(q)
      )
        return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#EDE2CD]/50 border border-[#133951]/8 shadow-sm p-4 space-y-2">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="h-[68px] rounded-xl bg-[#133951]/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#EDE2CD]/50 border border-[#133951]/8 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-[#133951]/10 bg-[#133951]/5">
        <div className="w-20 shrink-0 p-3 font-display text-xs font-semibold text-[#133951]/50">
          Table
        </div>
        <div
          className="flex-1 grid min-w-[600px]"
          style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}
        >
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot}
              className="p-3 text-center text-xs font-semibold text-[#133951]/50 border-l border-[#133951]/8"
            >
              {slot}:00
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="relative overflow-x-auto scrollbar-thin">
        <div className="relative min-w-[680px]">
          {showTimeline && (
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{
                left: `calc(80px + (100% - 80px) * ${timelinePercent / 100})`,
                width: "2px",
                backgroundColor: "rgba(173, 43, 16, 0.6)",
              }}
            >
              <div className="absolute -top-1 -left-[5px] w-3 h-3 rounded-full bg-[#AD2B10] shadow-md" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full bg-[#AD2B10] whitespace-nowrap shadow-md">
                {String(currentTime.getHours()).padStart(2, "0")}:
                {String(currentTime.getMinutes()).padStart(2, "0")}
              </div>
            </div>
          )}

          {TABLES.map((tableNum) => (
            <div
              key={tableNum}
              className="flex border-b border-[#133951]/5 last:border-0 hover:bg-[#EDE2CD]/60 transition-colors"
            >
              <div className="w-20 shrink-0 p-3 flex items-center">
                <span className="text-xs font-semibold text-[#133951]/60">
                  Table {tableNum}
                </span>
              </div>
              <div
                className="flex-1 grid"
                style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}
              >
                {renderRow(tableNum)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  function renderRow(tableNum) {
    const cells = [];
    let i = 0;
    while (i < TIME_SLOTS.length) {
      const slot = TIME_SLOTS[i];
      const reservation = getReservationAtSlot(
        reservations,
        tableNum,
        slot,
        selectedDate,
      );
      if (reservation) {
        cells.push(
          <ReservationCell
            key={slot}
            type="reservation"
            reservation={reservation}
            dimmed={isDimmed(reservation)}
            onClick={() => onSelectReservation(reservation)}
          />,
        );
        i += 2;
      } else {
        const hasNextBooking = reservations.some(
          (r) =>
            r.tableNumber === tableNum &&
            r.startTime === slot + 2 &&
            r.reservationDate === selectedDate &&
            r.status !== "Cancelled",
        );
        cells.push(
          <ReservationCell
            key={slot}
            type="available"
            walkInStatus={hasNextBooking ? "reserved_next" : "available"}
            onClick={(isWalkIn) => onCellClick(tableNum, slot, isWalkIn)}
          />,
        );
        i++;
      }
    }
    return cells;
  }
}
