import { useState, useEffect } from "react";

import { Reservation } from "@/api/reservations";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { TrendingUp, Calendar } from "lucide-react";

import { format, subDays } from "date-fns";

/* =========================
   CI Color System
========================= */
const C = {
  navy: "#133951",
  teal: "#5BAAAE",
  gold: "#E2A300",
  red: "#AD2B10",

  // New neutral surfaces
  background: "#F8FAFB",
  surface: "#FFFFFF",
  surfaceSoft: "#F3F7F7",

  border: "rgba(19,57,81,0.08)",
  grid: "rgba(19,57,81,0.07)",

  textMuted: "rgba(19,57,81,0.52)",
};

function getDateRange(days) {
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    return format(d, "yyyy-MM-dd");
  });
}

/* =========================
   Tooltip
========================= */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="
        rounded-xl
        px-4 py-3
        shadow-[0_8px_24px_rgba(19,57,81,0.10)]
        min-w-[160px]
      "
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
      }}
    >
      <p className="font-semibold text-[#133951] mb-2.5 text-sm">{label}</p>

      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.fill }}
              />

              <span className="text-xs text-[#133951]/55">{p.name}</span>
            </div>

            <span className="text-xs font-bold text-[#133951]">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DailyStatsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const dates = getDateRange(range);

        const allReservations = await Promise.all(
          dates.map((d) =>
            Reservation.filter({
              reservationDate: d,
            }),
          ),
        );

        const chartData = dates.map((date, i) => {
          const rsvs = allReservations[i] || [];

          const completed = rsvs.filter((r) =>
            ["CheckedIn", "Completed", "WalkIn"].includes(r.status),
          );

          return {
            date: format(new Date(date + "T12:00:00"), "dd MMM"),

            "Total Guests": completed.reduce(
              (sum, r) => sum + (r.guestCount || 0),
              0,
            ),

            Completed: rsvs.filter((r) =>
              ["Completed", "CheckedIn", "WalkIn"].includes(r.status),
            ).length,

            "No Show": rsvs.filter((r) => r.status === "NoShow").length,
          };
        });

        setData(chartData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [range]);

  return (
    <div
      className="
        rounded-2xl
        bg-white
        border border-[#133951]/[0.07]
        shadow-[0_2px_12px_rgba(19,57,81,0.05)]
        p-5
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="
              w-10 h-10
              rounded-xl
              bg-[#133951]
              flex items-center justify-center
              shadow-sm
            "
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-[#133951]">
              Daily Statistics
            </h3>

            <p className="text-xs text-[#133951]/45 mt-0.5">
              Guests · Completed · No Shows
            </p>
          </div>
        </div>

        {/* RANGE SELECTOR */}
        <div
          className="
            flex items-center gap-1
            bg-[#133951]/[0.05]
            border border-[#133951]/[0.04]
            rounded-xl
            p-1
          "
        >
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`
                px-3.5 py-1.5
                rounded-lg
                text-xs
                font-semibold
                transition-all
                duration-200
                ${
                  range === d
                    ? "bg-[#133951] text-white shadow-sm"
                    : "text-[#133951]/50 hover:text-[#133951] hover:bg-white/70"
                }
              `}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* CHART */}
      {loading ? (
        <div
          className="
            h-56
            rounded-xl
            bg-[#133951]/[0.025]
            flex items-center justify-center
            animate-pulse
          "
        >
          <Calendar className="w-8 h-8 text-[#133951]/15" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="3 4"
              stroke={C.grid}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{
                fill: C.navy,
                opacity: 0.5,
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              dy={5}
            />

            <YAxis
              tick={{
                fill: C.navy,
                opacity: 0.45,
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              width={28}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: "rgba(91,170,174,0.055)",
                radius: 8,
              }}
            />

            <Legend
              wrapperStyle={{
                fontSize: 11,
                color: C.textMuted,
                paddingTop: 14,
              }}
              iconType="circle"
              iconSize={7}
            />

            <Bar
              dataKey="Total Guests"
              fill={C.navy}
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />

            <Bar
              dataKey="Completed"
              fill={C.teal}
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />

            <Bar
              dataKey="No Show"
              fill={C.red}
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
