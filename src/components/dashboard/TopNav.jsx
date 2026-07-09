import { motion } from "framer-motion";
import { UtensilsCrossed, Search, Plus, Calendar } from "lucide-react";

const FILTERS = [
  "All",
  "Today",
  "Reserved",
  "Checked-in",
  "Completed",
  "No Show",
  "Walk-in",
];

export default function TopNav({
  selectedDate,
  onDateChange,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  onAddReservation,
  currentTime,
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#FFFCF5]/95 backdrop-blur-md border-b border-[#133951]/10 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#133951] flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-6 h-6 text-[#EDE2CD]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#133951] leading-tight">
                Reservation Dashboard
              </h1>
              <p className="text-xs text-[#133951]/50">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#133951]/40" />
            <input
              type="text"
              placeholder="Search by name, phone, or table..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 border border-[#133951]/10 text-sm text-[#133951] placeholder:text-[#133951]/40 focus:outline-none focus:ring-2 focus:ring-[#5BAAAE]/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#133951]/40 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="pl-10 pr-3 py-2.5 rounded-xl bg-white/60 border border-[#133951]/10 text-sm text-[#133951] focus:outline-none focus:ring-2 focus:ring-[#5BAAAE]/40 transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAddReservation}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#133951] text-[#EDE2CD] text-sm font-semibold shadow-md hover:bg-[#0f2d40] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Reservation
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? "bg-[#133951] text-[#EDE2CD] shadow-sm"
                  : "bg-white/40 text-[#133951]/60 hover:bg-white/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
