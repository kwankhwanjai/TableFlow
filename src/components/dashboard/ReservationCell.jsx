import { motion } from "framer-motion";
import { Users, Zap } from "lucide-react";

const STATUS_BG = {
  Reserved: "#E2A300",
  CheckedIn: "#133951",
  WalkIn: "#5BAAAE",
  NoShow: "#AD2B10",
  Completed: "#9CA3AF",
  Cancelled: "#D1D5DB",
};

const STATUS_LABEL = {
  Reserved: "Reserved",
  CheckedIn: "Checked-in",
  WalkIn: "Walk-in",
  NoShow: "No Show",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export default function ReservationCell({
  type,
  reservation,
  walkInStatus,
  dimmed,
  onClick,
}) {
  if (type === "reservation" && reservation) {
    const bg = STATUS_BG[reservation.status] || STATUS_BG.Reserved;
    const label = STATUS_LABEL[reservation.status] || reservation.status;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: dimmed ? 0.2 : 1, scale: 1 }}
        whileHover={{ scale: dimmed ? 1 : 1.02, y: dimmed ? 0 : -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={onClick}
        className="rounded-xl p-2 m-0.5 cursor-pointer h-[68px] flex flex-col justify-between border border-white/20 shadow-sm relative overflow-hidden"
        style={{ backgroundColor: bg, color: "#ffffff", gridColumn: "span 2" }}
      >
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-sm truncate leading-tight">
            {reservation.customerName}
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            <Users size={10} />
            <span className="text-[10px] font-medium">
              {reservation.guestCount}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium opacity-90">
            {reservation.startTime}:00 - {reservation.endTime}:00
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">
            {label}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: dimmed ? 0.2 : 1 }}
      whileHover={{ scale: dimmed ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onClick(false)}
      className="group rounded-xl m-0.5 cursor-pointer h-[68px] flex items-center justify-center border border-dashed border-[#133951]/15 hover:border-[#5BAAAE]/40 hover:bg-[#5BAAAE]/8 transition-colors relative"
    >
      {walkInStatus === "reserved_next" ? (
        <span className="text-[9px] text-[#133951]/50 font-medium px-1.5 py-0.5 rounded-full bg-[#133951]/8">
          Next Booking
        </span>
      ) : (
        <>
          <span className="text-[10px] text-[#133951]/30 font-medium group-hover:hidden">
            +
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(true);
            }}
            className="hidden group-hover:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5BAAAE]/20 text-[#133951] text-[10px] font-medium hover:bg-[#5BAAAE]/40 transition-colors"
          >
            <Zap size={10} /> Walk-in
          </button>
        </>
      )}
    </motion.div>
  );
}
