import { memo, useMemo } from "react";
import {
  UtensilsCrossed,
  Search,
  Plus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { getTodayDate } from "@/lib/reservationUtils";

const FILTERS = [
  "All",
  "Reserved",
  "Checked-in",
  "Completed",
  "No Show",
  "Walk-in",
];

/*
 * YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * เปลี่ยนวันโดยไม่ใช้ new Date("YYYY-MM-DD")
 *
 * เพราะ browser บางตัวจะตีความเป็น UTC
 * และอาจเกิด timezone bug
 */
function shiftDate(dateString, amount) {
  if (!dateString) return getTodayDate();

  const [year, month, day] = dateString.split("-").map(Number);

  /*
   * ใช้เวลาเที่ยงเพื่อลด DST / timezone edge case
   */
  const date = new Date(year, month - 1, day, 12, 0, 0);

  date.setDate(date.getDate() + amount);

  return formatDate(date);
}

function TopNav({
  selectedDate,
  onDateChange,

  searchQuery,
  onSearchChange,

  filter,
  onFilterChange,

  onAddReservation,
}) {
  const today = getTodayDate();

  const isToday = selectedDate === today;

  /*
   * แสดงวันที่ที่กำลังดู
   *
   * ไม่ใช่วันที่ของเครื่องเหมือน version เดิม
   */
  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "";

    const [year, month, day] = selectedDate.split("-").map(Number);

    const date = new Date(year, month - 1, day, 12);

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const handlePreviousDay = () => {
    onDateChange(shiftDate(selectedDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(shiftDate(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(today);
  };

  const clearSearch = () => {
    onSearchChange("");
  };

  return (
    <header
      className="
        sticky
        top-0
        z-40
        border-b
        border-slate-200
        bg-white/95
        shadow-sm
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* =========================
            TOP ROW
        ========================== */}

        <div
          className="
            flex
            min-h-[72px]
            items-center
            gap-4
            py-3
          "
        >
          {/* Brand */}

          <div
            className="
              flex
              min-w-0
              shrink-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-teal-700
                shadow-sm
              "
            >
              <UtensilsCrossed
                className="
                  h-5
                  w-5
                  text-white
                "
              />
            </div>

            <div className="hidden min-w-0 lg:block">
              <h1
                className="
                  truncate
                  text-base
                  font-semibold
                  text-slate-900
                "
              >
                Reservations
              </h1>

              <p
                className="
                  mt-0.5
                  truncate
                  text-xs
                  text-slate-500
                "
              >
                {selectedDateLabel}
              </p>
            </div>
          </div>

          {/* Search */}

          <div
            className="
              relative
              ml-auto
              hidden
              w-full
              max-w-md
              md:block
            "
          >
            <Search
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, phone or table..."
              aria-label="Search reservations"
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                pl-10
                pr-10
                text-sm
                text-slate-900
                outline-none
                transition

                placeholder:text-slate-400

                hover:border-slate-300

                focus:border-teal-500
                focus:bg-white
                focus:ring-4
                focus:ring-teal-500/10
              "
            />

            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="
                  absolute
                  right-2
                  top-1/2
                  flex
                  h-7
                  w-7
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  transition

                  hover:bg-slate-200
                  hover:text-slate-700
                "
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Date navigation */}

          <div
            className="
              flex
              shrink-0
              items-center
              rounded-xl
              border
              border-slate-200
              bg-white
            "
          >
            <button
              type="button"
              onClick={handlePreviousDay}
              aria-label="Previous day"
              className="
                flex
                h-10
                w-9
                items-center
                justify-center
                rounded-l-xl
                text-slate-500
                transition

                hover:bg-slate-100
                hover:text-slate-900
              "
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              className="
                relative
                border-x
                border-slate-200
              "
            >
              <CalendarDays
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => onDateChange(event.target.value)}
                aria-label="Reservation date"
                className="
                  h-[38px]
                  w-[154px]
                  border-0
                  bg-transparent
                  pl-9
                  pr-2
                  text-sm
                  font-medium
                  text-slate-700
                  outline-none
                "
              />
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              aria-label="Next day"
              className="
                flex
                h-10
                w-9
                items-center
                justify-center
                rounded-r-xl
                text-slate-500
                transition

                hover:bg-slate-100
                hover:text-slate-900
              "
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Today */}

          {!isToday && (
            <button
              type="button"
              onClick={handleToday}
              className="
                hidden
                h-10
                shrink-0
                items-center
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-sm
                font-medium
                text-slate-600
                transition

                hover:border-slate-300
                hover:bg-slate-50
                hover:text-slate-900

                sm:flex
              "
            >
              Today
            </button>
          )}

          {/* Add */}

          <button
            type="button"
            onClick={onAddReservation}
            className="
              inline-flex
              h-10
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-teal-700
              px-4
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition

              hover:bg-teal-800

              active:scale-[0.98]

              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-teal-500/20
            "
          >
            <Plus className="h-4 w-4" />

            <span className="hidden sm:inline">New Reservation</span>
          </button>
        </div>

        {/* =========================
            MOBILE SEARCH
        ========================== */}

        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search reservations..."
              aria-label="Search reservations"
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                pl-10
                pr-10
                text-sm
                text-slate-900
                outline-none

                placeholder:text-slate-400

                focus:border-teal-500
                focus:bg-white
                focus:ring-4
                focus:ring-teal-500/10
              "
            />

            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="
                  absolute
                  right-2
                  top-1/2
                  flex
                  h-7
                  w-7
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-200
                "
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* =========================
            FILTERS
        ========================== */}

        <div
          className="
            flex
            items-center
            gap-1
            overflow-x-auto
            border-t
            border-slate-100
            py-2.5
            scrollbar-none
          "
        >
          {FILTERS.map((filterItem) => {
            const active = filter === filterItem;

            return (
              <button
                key={filterItem}
                type="button"
                onClick={() => onFilterChange(filterItem)}
                aria-pressed={active}
                className={`
                    shrink-0
                    rounded-lg
                    px-3
                    py-1.5
                    text-xs
                    font-medium
                    transition

                    ${
                      active
                        ? `
                          bg-slate-900
                          text-white
                          shadow-sm
                        `
                        : `
                          text-slate-500
                          hover:bg-slate-100
                          hover:text-slate-900
                        `
                    }
                  `}
              >
                {filterItem}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default memo(TopNav);
