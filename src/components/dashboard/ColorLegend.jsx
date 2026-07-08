const LEGEND = [
  { label: "Available", color: "#EDE2CD", border: "#133951" },
  { label: "Reserved", color: "#E2A300", border: "#E2A300" },
  { label: "Checked-in", color: "#133951", border: "#133951" },
  { label: "Walk-in", color: "#5BAAAE", border: "#5BAAAE" },
  { label: "No Show", color: "#AD2B10", border: "#AD2B10" },
  { label: "Completed", color: "#9CA3AF", border: "#9CA3AF" },
];

export default function ColorLegend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-xs font-semibold text-[#133951]/50 uppercase tracking-wider">
        Legend
      </span>
      <div className="flex items-center gap-3 flex-wrap">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-md border"
              style={{
                backgroundColor: item.color,
                borderColor: item.border + "60",
              }}
            />
            <span className="text-xs text-[#133951]/60">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
