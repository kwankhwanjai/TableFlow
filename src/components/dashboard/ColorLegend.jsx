import { memo } from "react";

const LEGEND = [
  {
    label: "Available",
    dotClass: "bg-white border-slate-300",
  },
  {
    label: "Reserved",
    dotClass: "bg-blue-500 border-blue-500",
  },
  {
    label: "Checked-in",
    dotClass: "bg-emerald-500 border-emerald-500",
  },
  {
    label: "Walk-in",
    dotClass: "bg-amber-500 border-amber-500",
  },
  {
    label: "No Show",
    dotClass: "bg-red-500 border-red-500",
  },
  {
    label: "Completed",
    dotClass: "bg-slate-400 border-slate-400",
  },
];

function ColorLegend() {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        overflow-x-auto
        scrollbar-none
      "
      aria-label="Reservation status legend"
    >
      <span
        className="
          shrink-0
          text-[11px]
          font-semibold
          uppercase
          tracking-wider
          text-slate-400
        "
      >
        Status
      </span>

      <div className="flex items-center gap-3">
        {LEGEND.map((item) => (
          <div
            key={item.label}
            className="
              flex
              shrink-0
              items-center
              gap-1.5
            "
          >
            <span
              className={`
                h-2.5
                w-2.5
                rounded-full
                border
                ${item.dotClass}
              `}
              aria-hidden="true"
            />

            <span
              className="
                whitespace-nowrap
                text-xs
                font-medium
                text-slate-500
              "
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ColorLegend);
