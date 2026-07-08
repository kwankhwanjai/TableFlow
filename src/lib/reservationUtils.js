import { Reservation } from "@/api/reservations";

export const TIME_SLOTS = [11, 12, 13, 14, 15, 16, 17, 18, 19];
export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const BOOKING_DURATION = 2;
export const NOSHOW_MINUTES = 20;
export const VALID_START_TIMES = [11, 12, 13, 14, 15, 16, 17];

export function getEndTime(startTime) {
  return startTime + BOOKING_DURATION;
}

export function getTodayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTime(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function hasConflict(
  reservations,
  tableNumber,
  startTime,
  reservationDate,
  excludeId = null,
) {
  const endTime = getEndTime(startTime);
  return reservations.some((r) => {
    if (r.id === excludeId) return false;
    if (r.tableNumber !== tableNumber) return false;
    if (r.reservationDate !== reservationDate) return false;
    if (r.status === "Cancelled") return false;
    const rEnd = getEndTime(r.startTime);
    return startTime < rEnd && endTime > r.startTime;
  });
}

export function getReservationAtSlot(
  reservations,
  tableNumber,
  timeSlot,
  reservationDate,
) {
  return reservations.find(
    (r) =>
      r.tableNumber === tableNumber &&
      r.startTime === timeSlot &&
      r.reservationDate === reservationDate &&
      r.status !== "Cancelled",
  );
}

export function getSuggestedTables(
  reservations,
  startTime,
  reservationDate,
  excludeTable = null,
) {
  return TABLES.filter(
    (t) =>
      t !== excludeTable &&
      !hasConflict(reservations, t, startTime, reservationDate),
  );
}

export function autoAssignTable(reservations, startTime, reservationDate) {
  const available = TABLES.filter(
    (t) => !hasConflict(reservations, t, startTime, reservationDate),
  );
  if (available.length === 0) return null;

  const scored = available.map((t) => {
    const hasNextBooking = hasConflict(
      reservations,
      t,
      startTime + BOOKING_DURATION,
      reservationDate,
    );
    return { table: t, hasNextBooking };
  });

  scored.sort((a, b) => {
    if (a.hasNextBooking !== b.hasNextBooking) return a.hasNextBooking ? 1 : -1;
    return a.table - b.table;
  });

  return scored[0].table;
}

export function getWalkInStatus(
  reservations,
  tableNumber,
  timeSlot,
  reservationDate,
) {
  const nextSlot = timeSlot + BOOKING_DURATION;
  const hasNextBooking = reservations.some(
    (r) =>
      r.tableNumber === tableNumber &&
      r.startTime === nextSlot &&
      r.reservationDate === reservationDate &&
      r.status !== "Cancelled",
  );
  return hasNextBooking ? "reserved_next" : "available";
}

export function getReservationDateTime(reservationDate, startTime) {
  const d = new Date(reservationDate + "T00:00:00");
  d.setHours(startTime, 0, 0, 0);
  return d;
}

export async function checkAutoStatus(reservations, currentTime) {
  const updates = [];
  for (const r of reservations) {
    const startDateTime = getReservationDateTime(
      r.reservationDate,
      r.startTime,
    );
    const endDateTime = new Date(
      startDateTime.getTime() + BOOKING_DURATION * 3600000,
    );
    const noShowTime = new Date(
      startDateTime.getTime() + NOSHOW_MINUTES * 60000,
    );

    if (
      r.status === "Reserved" &&
      currentTime >= noShowTime &&
      currentTime < endDateTime
    ) {
      updates.push(
        Reservation.update(r.id, { status: "NoShow" }),
      );
    }
    if (r.status === "CheckedIn" && currentTime >= endDateTime) {
      updates.push(
        Reservation.update(r.id, { status: "Completed" }),
      );
    }
  }
  if (updates.length > 0) await Promise.all(updates);
  return updates.length;
}

export const STATUS_CONFIG = {
  Reserved: {
    label: "Reserved",
    bg: "#E2A300",
    text: "#ffffff",
    light: "rgba(226,163,0,0.10)",
  },
  CheckedIn: {
    label: "Checked-in",
    bg: "#133951",
    text: "#ffffff",
    light: "rgba(19,57,81,0.08)",
  },
  WalkIn: {
    label: "Walk-in",
    bg: "#5BAAAE",
    text: "#ffffff",
    light: "rgba(91,170,174,0.10)",
  },
  NoShow: {
    label: "No Show",
    bg: "#AD2B10",
    text: "#ffffff",
    light: "rgba(173,43,16,0.08)",
  },
  Completed: {
    label: "Completed",
    bg: "#9CA3AF",
    text: "#ffffff",
    light: "rgba(156,163,175,0.10)",
  },
  Cancelled: {
    label: "Cancelled",
    bg: "#D1D5DB",
    text: "#6B7280",
    light: "rgba(209,213,219,0.12)",
  },
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.Reserved;
}
