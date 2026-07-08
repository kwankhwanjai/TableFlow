import { motion } from "framer-motion";
import { CheckCircle, Clock, Users, UserX, Zap } from "lucide-react";

const CARDS = [
  {
    key: "available",
    label: "Available Tables",
    icon: CheckCircle,
    color: "#133951",
    bg: "rgba(19,57,81,0.08)",
  },
  {
    key: "reserved",
    label: "Reserved",
    icon: Clock,
    color: "#E2A300",
    bg: "rgba(226,163,0,0.10)",
  },
  {
    key: "checkedIn",
    label: "Checked-in",
    icon: Users,
    color: "#5BAAAE",
    bg: "rgba(91,170,174,0.10)",
  },
  {
    key: "walkIn",
    label: "Walk-in",
    icon: Zap,
    color: "#5BAAAE",
    bg: "rgba(91,170,174,0.08)",
  },
  {
    key: "noShow",
    label: "No Show",
    icon: UserX,
    color: "#AD2B10",
    bg: "rgba(173,43,16,0.08)",
  },
];

export default function SummaryCards({ reservations }) {
  const totalTables = 10;
  const occupiedTables = new Set(
    reservations
      .filter((r) => ["Reserved", "CheckedIn", "WalkIn"].includes(r.status))
      .map((r) => r.tableNumber),
  ).size;

  const counts = {
    available: Math.max(0, totalTables - occupiedTables),
    reserved: reservations.filter((r) => r.status === "Reserved").length,
    checkedIn: reservations.filter((r) => r.status === "CheckedIn").length,
    walkIn: reservations.filter((r) => r.status === "WalkIn").length,
    noShow: reservations.filter((r) => r.status === "NoShow").length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl p-4 border border-[#133951]/8 shadow-sm"
            style={{ backgroundColor: card.bg }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: card.color }}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-2xl font-bold font-display"
                style={{ color: card.color }}
              >
                {counts[card.key]}
              </span>
            </div>
            <p className="text-xs font-medium text-[#133951]/60">
              {card.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
