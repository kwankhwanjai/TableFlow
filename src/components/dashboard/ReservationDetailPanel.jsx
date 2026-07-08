import { motion } from "framer-motion";
import {
  X,
  Phone,
  Users,
  Clock,
  Table2,
  FileText,
  CheckCircle,
  Edit,
  Trash2,
  Ban,
  User,
} from "lucide-react";
import { getStatusConfig } from "@/lib/reservationUtils";

export default function ReservationDetailPanel({
  reservation,
  currentTime,
  onClose,
  onCheckIn,
  onEdit,
  onCancel,
  onDelete,
  onCustomerClick,
}) {
  const config = getStatusConfig(reservation.status);
  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  const canCheckIn =
    reservation.status === "Reserved" && currentHour >= reservation.startTime;

  const fields = [
    { icon: Phone, label: "Phone Number", value: reservation.phone },
    {
      icon: Users,
      label: "Guest Count",
      value: `${reservation.guestCount} people`,
    },
    {
      icon: Clock,
      label: "Reservation Time",
      value: `${reservation.startTime}:00 - ${reservation.endTime}:00`,
    },
    { icon: Table2, label: "Table", value: `Table ${reservation.tableNumber}` },
  ];
  if (reservation.note)
    fields.push({
      icon: FileText,
      label: "Special Note",
      value: reservation.note,
    });
  if (reservation.checkedInAt)
    fields.push({
      icon: CheckCircle,
      label: "Checked-in At",
      value: new Date(reservation.checkedInAt).toLocaleString(),
    });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-[#EDE2CD] shadow-2xl border-l border-[#133951]/10 overflow-y-auto scrollbar-thin"
      >
        <div
          className="p-5 border-b border-[#133951]/10 flex items-start justify-between"
          style={{ backgroundColor: config.light }}
        >
          <div>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: config.bg }}
            >
              {config.label}
            </span>
            <h2 className="font-display text-lg font-bold text-[#133951] mt-1.5">
              Reservation Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#133951]/10 transition-colors"
          >
            <X className="w-5 h-5 text-[#133951]/60" />
          </button>
        </div>

        <div className="p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3 py-2.5 border-b border-[#133951]/8">
              <div className="w-8 h-8 rounded-lg bg-[#133951]/8 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-[#133951]/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#133951]/50">Customer Name</p>
                <button
                  onClick={() => onCustomerClick(reservation)}
                  className="text-sm font-medium text-[#AD2B10] hover:underline"
                >
                  {reservation.customerName}
                </button>
              </div>
            </div>
            {fields.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 border-b border-[#133951]/8"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#133951]/8 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#133951]/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#133951]/50">{f.label}</p>
                    <p className="text-sm font-medium text-[#133951] break-words">
                      {f.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-2">
            {canCheckIn && (
              <button
                onClick={() => onCheckIn(reservation)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#133951] text-[#EDE2CD] text-sm font-semibold shadow-md hover:bg-[#0f2d40] transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Check-in
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onEdit(reservation)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/60 text-[#133951] text-sm font-medium hover:bg-white/80 transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => onCancel(reservation)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#E2A300]/15 text-[#E2A300] text-sm font-medium hover:bg-[#E2A300]/25 transition-colors"
              >
                <Ban className="w-4 h-4" /> Cancel
              </button>
            </div>
            <button
              onClick={() => onDelete(reservation)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#AD2B10]/10 text-[#AD2B10] text-sm font-medium hover:bg-[#AD2B10]/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
