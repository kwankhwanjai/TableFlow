import { memo, useMemo } from "react";
import { TIME_SLOTS, TABLES, getTodayDate } from "@/lib/reservationUtils";
import ReservationCell from "./ReservationCell";

const FILTER_MAP = {
  Reserved: "Reserved",
  "Checked-in": "CheckedIn",
  Completed: "Completed",
  "No Show": "NoShow",
  "Walk-in": "WalkIn",
};

const TABLE_COLUMN_WIDTH = 96;

const makeSlotKey = (tableNumber, startTime) =>
  `${Number(tableNumber)}:${Number(startTime)}`;

function ReservationGrid({
  reservations = [],
  selectedDate,
  currentTime,
  filter,
  searchQuery,
  loading,
  onSelectReservation,
  onCellClick,
}) {
  /*
   * ============================
   * CURRENT TIME LINE
   * ============================
   */

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;

  const firstSlot = Number(TIME_SLOTS[0]);

  const lastSlot = Number(TIME_SLOTS[TIME_SLOTS.length - 1]);

  /*
   * ถ้ามี slot 11 - 19
   * timeline จะสิ้นสุดจริงที่ 20:00
   */
  const timelineEnd = lastSlot + 1;

  const isToday = selectedDate === getTodayDate();

  const showTimeline =
    isToday && currentHour >= firstSlot && currentHour < timelineEnd;

  const timelinePercent = showTimeline
    ? ((currentHour - firstSlot) / (timelineEnd - firstSlot)) * 100
    : 0;

  /*
   * ============================
   * SEARCH
   * ============================
   */

  const normalizedQuery = useMemo(
    () => searchQuery?.trim().toLowerCase() || "",
    [searchQuery],
  );

  const targetStatus =
    filter !== "All" && filter !== "Today" ? FILTER_MAP[filter] : null;

  /*
   * ============================
   * RESERVATION INDEX
   * ============================
   *
   * เดิม:
   *
   * ทุก cell ต้อง search reservations
   *
   * ใหม่:
   *
   * สร้าง Map ครั้งเดียว
   * แล้ว lookup O(1)
   */

  const reservationIndex = useMemo(() => {
    const map = new Map();

    for (const reservation of reservations) {
      if (reservation.reservationDate !== selectedDate) {
        continue;
      }

      /*
       * Cancelled ไม่ควรกินพื้นที่บน Grid
       */
      if (reservation.status === "Cancelled") {
        continue;
      }

      const key = makeSlotKey(reservation.tableNumber, reservation.startTime);

      map.set(key, reservation);
    }

    return map;
  }, [reservations, selectedDate]);

  /*
   * ============================
   * CREATE ROW MODEL
   * ============================
   *
   * สำคัญ:
   * currentTime ไม่ใช่ dependency
   *
   * เพราะฉะนั้นเวลานาฬิกา update ทุก 30 sec
   * จะไม่สร้าง grid model ใหม่ทั้งหมด
   */

  const rows = useMemo(() => {
    const reservationIsDimmed = (reservation) => {
      if (!reservation) return false;

      /*
       * Filter
       */
      if (targetStatus && reservation.status !== targetStatus) {
        return true;
      }

      /*
       * Search
       */
      if (normalizedQuery) {
        const name = reservation.customerName?.toLowerCase().trim() || "";

        const phone = String(reservation.phone || "")
          .toLowerCase()
          .trim();

        const table = String(reservation.tableNumber ?? "").toLowerCase();

        const matched =
          name.includes(normalizedQuery) ||
          phone.includes(normalizedQuery) ||
          table.includes(normalizedQuery);

        if (!matched) {
          return true;
        }
      }

      return false;
    };

    return TABLES.map((tableNum) => {
      const cells = [];

      let index = 0;

      while (index < TIME_SLOTS.length) {
        const slot = Number(TIME_SLOTS[index]);

        const reservation = reservationIndex.get(makeSlotKey(tableNum, slot));

        /*
         * ======================
         * RESERVED CELL
         * ======================
         */
        if (reservation) {
          cells.push({
            key: reservation.id || `${tableNum}-${slot}`,

            type: "reservation",

            reservation,

            dimmed: reservationIsDimmed(reservation),
          });

          /*
           * Reservation ปัจจุบันใช้เวลา 2 ชั่วโมง
           *
           * ReservationCell ต้องมี col-span-2
           */
          index += 2;

          continue;
        }

        /*
         * ======================
         * EMPTY CELL
         * ======================
         *
         * ตรวจว่าหลังจาก 2 ชั่วโมง
         * มี booking หรือไม่
         */
        const nextReservation = reservationIndex.get(
          makeSlotKey(tableNum, slot + 2),
        );

        cells.push({
          key: `${tableNum}-${slot}`,

          type: "available",

          tableNumber: tableNum,

          slot,

          walkInStatus: nextReservation ? "reserved_next" : "available",
        });

        index += 1;
      }

      return {
        tableNumber: tableNum,
        cells,
      };
    });
  }, [reservationIndex, normalizedQuery, targetStatus]);

  /*
   * ============================
   * LOADING
   * ============================
   */

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="space-y-px">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex h-[68px] items-center border-b border-slate-100 px-4 last:border-0"
            >
              <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />

              <div className="ml-6 h-10 flex-1 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /*
   * ============================
   * GRID
   * ============================
   */

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/*
        Header + body อยู่ scroll container เดียวกัน

        แก้ปัญหา:
        body scroll แต่ header ไม่ scroll ตาม
      */}
      <div className="relative overflow-auto scrollbar-thin">
        <div className="relative min-w-[880px]">
          {/* ================= HEADER ================= */}

          <div className="sticky top-0 z-40 flex border-b border-slate-200 bg-slate-50/95 backdrop-blur">
            <div
              className="
                sticky
                left-0
                z-50
                flex
                shrink-0
                items-center
                border-r
                border-slate-200
                bg-slate-50
                px-4
                py-3
              "
              style={{
                width: TABLE_COLUMN_WIDTH,
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Table
              </span>
            </div>

            <div
              className="grid flex-1"
              style={{
                gridTemplateColumns: `repeat(${TIME_SLOTS.length}, minmax(76px, 1fr))`,
              }}
            >
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="
                    border-r
                    border-slate-200
                    px-2
                    py-3
                    text-center
                    text-xs
                    font-semibold
                    text-slate-500
                    last:border-r-0
                  "
                >
                  {String(slot).padStart(2, "0")}
                  :00
                </div>
              ))}
            </div>
          </div>

          {/* ================= CURRENT TIME ================= */}

          {showTimeline && (
            <div
              className="pointer-events-none absolute bottom-0 top-[41px] z-30"
              style={{
                left: `calc(
                  ${TABLE_COLUMN_WIDTH}px +
                  (100% - ${TABLE_COLUMN_WIDTH}px) *
                  ${timelinePercent / 100}
                )`,
              }}
            >
              <div className="absolute inset-y-0 w-[2px] bg-red-500/70" />

              <div className="absolute -left-[5px] -top-1 h-3 w-3 rounded-full bg-red-500 shadow" />

              <div
                className="
                  absolute
                  left-1/2
                  top-2
                  -translate-x-1/2
                  whitespace-nowrap
                  rounded-full
                  bg-red-600
                  px-2
                  py-1
                  text-[10px]
                  font-semibold
                  text-white
                  shadow-sm
                "
              >
                {String(currentTime.getHours()).padStart(2, "0")}:
                {String(currentTime.getMinutes()).padStart(2, "0")}
              </div>
            </div>
          )}

          {/* ================= ROWS ================= */}

          <div>
            {rows.map(({ tableNumber, cells }) => (
              <div
                key={tableNumber}
                className="
                    group
                    flex
                    min-h-[68px]
                    border-b
                    border-slate-100
                    last:border-b-0
                    hover:bg-slate-50/70
                  "
              >
                {/* Sticky table number */}

                <div
                  className="
                      sticky
                      left-0
                      z-20
                      flex
                      shrink-0
                      items-center
                      border-r
                      border-slate-200
                      bg-white
                      px-4
                      transition-colors
                      group-hover:bg-slate-50
                    "
                  style={{
                    width: TABLE_COLUMN_WIDTH,
                  }}
                >
                  <div>
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Table
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {tableNumber}
                    </span>
                  </div>
                </div>

                {/* Reservation cells */}

                <div
                  className="grid flex-1"
                  style={{
                    gridTemplateColumns: `repeat(${TIME_SLOTS.length}, minmax(76px, 1fr))`,
                  }}
                >
                  {cells.map((cell) => {
                    if (cell.type === "reservation") {
                      return (
                        <ReservationCell
                          key={cell.key}
                          type="reservation"
                          reservation={cell.reservation}
                          dimmed={cell.dimmed}
                          onClick={() => onSelectReservation(cell.reservation)}
                        />
                      );
                    }

                    return (
                      <ReservationCell
                        key={cell.key}
                        type="available"
                        walkInStatus={cell.walkInStatus}
                        onClick={(isWalkIn) =>
                          onCellClick(cell.tableNumber, cell.slot, isWalkIn)
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ReservationGrid);
