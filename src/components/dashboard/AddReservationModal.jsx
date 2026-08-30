import { useMemo } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";

import {
  X,
  Users,
  Phone,
  Calendar,
  Clock,
  FileText,
  Check,
  AlertCircle,
  Sparkles,
  Table2,
} from "lucide-react";

import {
  VALID_START_TIMES,
  TABLES,
  getEndTime,
  hasConflict,
  getSuggestedTables,
  autoAssignTable,
  getTodayDate,
} from "@/lib/reservationUtils";

export default function AddReservationModal({
  onClose,
  onSave,
  editing,
  prefill,
  isWalkIn,
  allReservations,
  selectedDate,
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerName: editing?.customerName || "",
      phone: editing?.phone || "",
      guestCount: editing?.guestCount || 2,
      reservationDate:
        editing?.reservationDate ||
        prefill?.reservationDate ||
        selectedDate ||
        getTodayDate(),
      startTime:
        editing?.startTime ||
        prefill?.startTime ||
        (isWalkIn ? Math.min(Math.max(new Date().getHours(), 11), 17) : 11),
      tableMode: "auto",
      tableNumber: editing?.tableNumber || prefill?.tableNumber || 1,
      requestedTable: editing?.requestedTable || "No",
      note: editing?.note || "",
    },
  });

  const watchedStartTime = Number(watch("startTime"));
  const watchedDate = watch("reservationDate");
  const watchedTableMode = watch("tableMode");
  const watchedTable = Number(watch("tableNumber"));

  const conflict = useMemo(() => {
    if (watchedTableMode !== "choose") return false;

    return hasConflict(
      allReservations,
      watchedTable,
      watchedStartTime,
      watchedDate,
      editing?.id,
    );
  }, [
    allReservations,
    watchedTable,
    watchedStartTime,
    watchedDate,
    watchedTableMode,
    editing,
  ]);

  const suggestedTables = useMemo(() => {
    if (!conflict) return [];

    return getSuggestedTables(
      allReservations,
      watchedStartTime,
      watchedDate,
      watchedTable,
    );
  }, [conflict, allReservations, watchedStartTime, watchedDate, watchedTable]);

  const autoTable = useMemo(() => {
    if (watchedTableMode !== "auto") return null;

    return autoAssignTable(allReservations, watchedStartTime, watchedDate);
  }, [watchedTableMode, allReservations, watchedStartTime, watchedDate]);

  const isDisabled =
    (watchedTableMode === "auto" && !autoTable) ||
    (watchedTableMode === "choose" && conflict);

  const onSubmit = (data) => {
    const startTime = Number(data.startTime);
    const endTime = getEndTime(startTime);

    let tableNumber;

    if (data.tableMode === "auto") {
      tableNumber = autoTable;

      if (!tableNumber) return;
    } else {
      tableNumber = Number(data.tableNumber);

      if (conflict) return;
    }

    onSave({
      customerName: data.customerName,
      phone: data.phone,
      guestCount: Number(data.guestCount),
      tableNumber,
      reservationDate: data.reservationDate,
      startTime,
      endTime,
      status: isWalkIn ? "WalkIn" : editing?.status || "Reserved",
      requestedTable: data.requestedTable,
      note: data.note || "",
    });
  };

  const inputClass =
    "w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#133951]/10 text-sm text-[#133951] placeholder:text-[#133951]/35 focus:outline-none focus:ring-2 focus:ring-[#5BAAAE]/25 focus:border-[#5BAAAE]/60 transition-all";

  const labelClass = "text-xs font-semibold text-[#133951]/60 mb-1 block";

  const toggleBtn = (active) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? "bg-[#133951] text-white shadow-sm"
        : "bg-[#133951]/5 text-[#133951]/60 hover:bg-[#133951]/10 hover:text-[#133951]"
    }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#133951]/25 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{
          scale: 0.95,
          opacity: 0,
          y: 10,
        }}
        animate={{
          scale: 1,
          opacity: 1,
          y: 0,
        }}
        exit={{
          scale: 0.95,
          opacity: 0,
          y: 10,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8FAFB] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#133951]/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#133951]/10 sticky top-0 bg-[#F8FAFB] z-10">
          <div className="flex items-center gap-2">
            {isWalkIn ? (
              <Sparkles className="w-5 h-5 text-[#5BAAAE]" />
            ) : (
              <Calendar className="w-5 h-5 text-[#E2A300]" />
            )}

            <h2 className="font-display text-lg font-bold text-[#133951]">
              {editing
                ? "Edit Reservation"
                : isWalkIn
                  ? "Seat Walk-in"
                  : "Add Reservation"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#133951]/5 transition-colors"
          >
            <X className="w-5 h-5 text-[#133951]/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Customer Name */}
          <div>
            <label className={labelClass}>Customer Name *</label>

            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#133951]/35" />

              <input
                {...register("customerName", {
                  required: "Name is required",
                })}
                className={inputClass}
                placeholder="Enter customer name"
              />
            </div>

            {errors.customerName && (
              <p className="text-xs text-[#AD2B10] mt-1">
                {errors.customerName.message}
              </p>
            )}
          </div>

          {/* Phone / Guest Count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phone Number *</label>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#133951]/35" />

                <input
                  {...register("phone", {
                    required: "Phone is required",
                  })}
                  className={inputClass}
                  placeholder="Phone number"
                />
              </div>

              {errors.phone && (
                <p className="text-xs text-[#AD2B10] mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Guest Count *</label>

              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#133951]/35" />

                <input
                  type="number"
                  min="1"
                  {...register("guestCount", {
                    required: "Required",
                    min: 1,
                  })}
                  className={inputClass}
                  placeholder="2"
                />
              </div>

              {errors.guestCount && (
                <p className="text-xs text-[#AD2B10] mt-1">
                  {errors.guestCount.message}
                </p>
              )}
            </div>
          </div>

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Reservation Date *</label>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#133951]/35" />

                <input
                  type="date"
                  {...register("reservationDate", {
                    required: "Date is required",
                  })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Reservation Time *</label>

              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#133951]/35" />

                <select {...register("startTime")} className={inputClass}>
                  {VALID_START_TIMES.map((t) => (
                    <option key={t} value={t}>
                      {t}:00 - {t + 2}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Selection */}
          <div>
            <label className={labelClass}>Table Selection</label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue("tableMode", "auto")}
                className={toggleBtn(watchedTableMode === "auto")}
              >
                <Sparkles className="w-4 h-4" />
                Auto Assign
              </button>

              <button
                type="button"
                onClick={() => setValue("tableMode", "choose")}
                className={toggleBtn(watchedTableMode === "choose")}
              >
                <Table2 className="w-4 h-4" />
                Choose Table
              </button>
            </div>
          </div>

          {/* Auto Table */}
          {watchedTableMode === "auto" && (
            <div className="rounded-xl bg-[#5BAAAE]/[0.07] border border-[#5BAAAE]/20 p-3 flex items-center gap-2">
              {autoTable ? (
                <>
                  <Check className="w-4 h-4 text-[#5BAAAE] shrink-0" />

                  <span className="text-sm text-[#133951]">
                    Suggested table: <strong>Table {autoTable}</strong>
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-[#AD2B10] shrink-0" />

                  <span className="text-sm text-[#AD2B10]">
                    No tables available for this time slot.
                  </span>
                </>
              )}
            </div>
          )}

          {/* Choose Table */}
          {watchedTableMode === "choose" && (
            <div>
              <div className="relative">
                <Table2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#133951]/35" />

                <select {...register("tableNumber")} className={inputClass}>
                  {TABLES.map((t) => (
                    <option key={t} value={t}>
                      Table {t}
                    </option>
                  ))}
                </select>
              </div>

              {conflict && (
                <div className="mt-2 rounded-xl bg-[#AD2B10]/[0.06] border border-[#AD2B10]/15 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4 text-[#AD2B10] shrink-0" />

                    <span className="text-sm font-medium text-[#AD2B10]">
                      This table is unavailable.
                    </span>
                  </div>

                  {suggestedTables.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <span className="text-xs text-[#133951]/50">
                        Suggested tables:
                      </span>

                      {suggestedTables.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setValue("tableNumber", t)}
                          className="px-2 py-0.5 rounded-full bg-[#133951]/[0.07] text-xs font-medium text-[#133951] hover:bg-[#133951]/15 transition-colors"
                        >
                          Table {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Requested Table */}
          <div>
            <label className={labelClass}>Requested Table</label>

            <div className="flex gap-2">
              {["Yes", "No"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue("requestedTable", opt)}
                  className={toggleBtn(watch("requestedTable") === opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Special Note */}
          <div>
            <label className={labelClass}>Special Note</label>

            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[#133951]/35" />

              <textarea
                {...register("note")}
                rows={2}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#133951]/10 text-sm text-[#133951] placeholder:text-[#133951]/35 focus:outline-none focus:ring-2 focus:ring-[#5BAAAE]/25 focus:border-[#5BAAAE]/60 transition-all resize-none"
                placeholder="Any special requests..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#133951]/[0.05] text-[#133951]/65 text-sm font-medium hover:bg-[#133951]/10 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isDisabled}
              className="flex-1 py-2.5 rounded-xl bg-[#133951] text-white text-sm font-semibold shadow-md hover:bg-[#0F2D40] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editing ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
