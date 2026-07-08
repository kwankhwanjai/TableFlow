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

// Colors from Palette No.8
const C = {
  navy: "#133951",
  teal: "#5BAAAE",
  gold: "#E2A300",
  red: "#AD2B10",
  cream: "#EDE2CD",
};

function getDateRange(days) {
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    return format(d, "yyyy-MM-dd");
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#133951]/10 bg-[#EDE2CD] shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#133951] mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: p.fill }}
          />
          <span className="text-[#133951]/70">{p.name}:</span>
          <span className="font-bold text-[#133951]">{p.value}</span>
        </div>
      ))}
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
            Reservation.filter({ reservationDate: d }),
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
              (s, r) => s + (r.guestCount || 0),
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
    <div className="rounded-2xl bg-[#EDE2CD]/60 border border-[#133951]/10 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#133951] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#EDE2CD]" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#133951]">
              Daily Statistics
            </h3>
            <p className="text-xs text-[#133951]/50">
              Guests · Completed · No Shows
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#133951]/8 rounded-xl p-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === d
                  ? "bg-[#133951] text-[#EDE2CD] shadow-sm"
                  : "text-[#133951]/60 hover:text-[#133951]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-56 rounded-xl bg-[#133951]/5 animate-pulse flex items-center justify-center">
          <Calendar className="w-8 h-8 text-[#133951]/20" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(19,57,81,0.08)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#133951", opacity: 0.55, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#133951", opacity: 0.55, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(19,57,81,0.04)", radius: 8 }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 11,
                color: "rgba(19,57,81,0.6)",
                paddingTop: 12,
              }}
              iconType="circle"
              iconSize={8}
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
