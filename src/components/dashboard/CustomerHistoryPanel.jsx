import { useState, useEffect } from "react";

import { motion } from "framer-motion";

import { Reservation } from "@/api/reservations";

import {
  X,
  Phone,
  Calendar,
  Clock,
  Table2,
  History,
  AlertTriangle,
  Users,
} from "lucide-react";

import { getStatusConfig } from "@/lib/reservationUtils";

export default function CustomerHistoryPanel({ customer, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await Reservation.filter({
          phone: customer.phone,
        });

        setHistory(
          data.sort(
            (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate),
          ),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [customer]);

  const totalVisits = history.length;

  const noShowCount = history.filter((r) => r.status === "NoShow").length;

  const completedCount = history.filter((r) => r.status === "Completed").length;

  const avgPartySize =
    totalVisits > 0
      ? Math.round(
          history.reduce((s, r) => s + (r.guestCount || 0), 0) / totalVisits,
        )
      : 0;

  const pastNotes = history.filter((r) => r.note);

  const stats = [
    {
      icon: History,
      label: "Total Visits",
      value: totalVisits,
      color: "#133951",
    },
    {
      icon: Users,
      label: "Avg Party Size",
      value: avgPartySize,
      color: "#E2A300",
    },
    {
      icon: AlertTriangle,
      label: "No Shows",
      value: noShowCount,
      color: "#AD2B10",
    },
    {
      icon: Calendar,
      label: "Completed",
      value: completedCount,
      color: "#5BAAAE",
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-[#133951]/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-sm bg-[#F8FAFB] shadow-2xl border-l border-[#133951]/10 overflow-y-auto scrollbar-thin"
      >
        <div className="p-5 border-b border-[#133951]/[0.07] flex items-start justify-between bg-[#133951]/[0.035]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-4 h-4 text-[#5BAAAE]" />

              <span className="text-xs font-semibold text-[#5BAAAE] uppercase tracking-wider">
                Customer History
              </span>
            </div>

            <h2 className="font-display text-lg font-bold text-[#133951]">
              {customer.name}
            </h2>

            <div className="flex items-center gap-1 mt-1 text-xs text-[#133951]/55">
              <Phone className="w-3 h-3" />
              {customer.phone}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#133951]/[0.06] transition-colors"
          >
            <X className="w-5 h-5 text-[#133951]/50" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-[#133951]/[0.04] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {stats.map((s, i) => {
                  const Icon = s.icon;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl p-3 border border-[#133951]/[0.06]"
                      style={{
                        backgroundColor: s.color + "0D",
                      }}
                    >
                      <Icon
                        className="w-4 h-4 mb-1.5"
                        style={{
                          color: s.color,
                        }}
                      />

                      <p
                        className="text-xl font-bold font-display"
                        style={{
                          color: s.color,
                        }}
                      >
                        {s.value}
                      </p>

                      <p className="text-[10px] text-[#133951]/50 font-medium">
                        {s.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {pastNotes.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-[#133951]/50 uppercase tracking-wider mb-2">
                    Past Notes
                  </h3>

                  <div className="space-y-1.5">
                    {pastNotes.slice(0, 5).map((r, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-white p-2.5 border border-[#133951]/[0.06]"
                      >
                        <p className="text-xs text-[#133951]/40 mb-0.5">
                          {r.reservationDate}
                        </p>

                        <p className="text-xs text-[#133951]">{r.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-[#133951]/50 uppercase tracking-wider mb-2">
                  Reservation History
                </h3>

                <div className="space-y-2">
                  {history.map((r) => {
                    const config = getStatusConfig(r.status);

                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-[#133951]/[0.06]"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: config.bg,
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#133951]">
                            {r.reservationDate} · {r.startTime}:00
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-[#133951]/45">
                            <span className="flex items-center gap-0.5">
                              <Table2 className="w-2.5 h-2.5" />T{r.tableNumber}
                            </span>

                            <span className="flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" />
                              {r.guestCount}
                            </span>
                          </div>
                        </div>

                        <span
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white shrink-0"
                          style={{
                            backgroundColor: config.bg,
                          }}
                        >
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
