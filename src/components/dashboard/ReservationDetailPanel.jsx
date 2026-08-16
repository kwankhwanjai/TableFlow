import { memo, useEffect, useMemo } from "react";

import { motion } from "framer-motion";

import {
  X,
  Phone,
  Users,
  Clock,
  Table2,
  FileText,
  CheckCircle2,
  Edit3,
  Trash2,
  Ban,
  User,
  CalendarDays,
  History,
  Loader2,
} from "lucide-react";

import { getTodayDate } from "@/lib/reservationUtils";

/*
 * =========================================
 * STATUS DESIGN SYSTEM
 * =========================================
 *
 * ตอนนี้รวมสีของ status ไว้ที่เดียวก่อน
 *
 * ขั้นต่อไปควรย้าย object นี้ไป
 * "@/lib/reservationStatus"
 *
 * แล้วให้:
 * - ReservationCell
 * - ColorLegend
 * - ReservationDetailPanel
 *
 * ใช้ config ตัวเดียวกัน
 */
const STATUS_CONFIG = {
  Reserved: {
    label: "Reserved",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },

  CheckedIn: {
    label: "Checked in",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },

  WalkIn: {
    label: "Walk-in",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },

  Completed: {
    label: "Completed",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },

  NoShow: {
    label: "No show",
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },

  Cancelled: {
    label: "Cancelled",
    badge: "border-slate-200 bg-slate-50 text-slate-500",
    dot: "bg-slate-400",
  },
};

const DEFAULT_STATUS = {
  label: "Unknown",
  badge: "border-slate-200 bg-slate-50 text-slate-600",
  dot: "bg-slate-400",
};

/*
 * =========================================
 * FORMAT TIME
 * =========================================
 *
 * รองรับทั้ง:
 *
 * 11    -> 11:00
 * 11.5  -> 11:30
 *
 * เผื่ออนาคตเปลี่ยนเป็น reservation
 * ทุกครึ่งชั่วโมง
 */
function formatTime(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  const hours = Math.floor(numericValue);

  const minutes = Math.round((numericValue - hours) * 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

/*
 * YYYY-MM-DD -> readable date
 *
 * ไม่ใช้ new Date("YYYY-MM-DD")
 * ตรง ๆ เพื่อเลี่ยง UTC date shifting
 */
function formatReservationDate(dateString) {
  if (!dateString) return "-";

  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day, 12);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReservationDetailPanel({
  reservation,
  currentTime,
  onClose,
  onCheckIn,
  onEdit,
  onCancel,
  onDelete,
  onCustomerClick,
  loading = false,
}) {
  const status = STATUS_CONFIG[reservation.status] || DEFAULT_STATUS;

  /*
   * =========================================
   * KEYBOARD
   * =========================================
   *
   * Escape = ปิด drawer
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, loading]);

  /*
   * =========================================
   * CURRENT TIME
   * =========================================
   */

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;

  const isToday = reservation.reservationDate === getTodayDate();

  /*
   * Bug ของ version เดิม:
   *
   * เปิด reservation พรุ่งนี้
   * ตอน 20:00
   *
   * ถ้า booking 17:00
   *
   * 20 >= 17
   *
   * => แสดง Check-in ผิด
   *
   * ใหม่ต้องเป็น reservation วันนี้ด้วย
   */
  const canCheckIn =
    reservation.status === "Reserved" &&
    isToday &&
    currentHour >= Number(reservation.startTime);

  /*
   * Action ตาม state
   */
  const canEdit =
    reservation.status !== "Cancelled" && reservation.status !== "Completed";

  const canCancel = reservation.status === "Reserved";

  /*
   * =========================================
   * INFORMATION
   * =========================================
   */

  const fields = useMemo(() => {
    const result = [
      {
        key: "date",
        icon: CalendarDays,
        label: "Reservation Date",

        value: formatReservationDate(reservation.reservationDate),
      },

      {
        key: "time",
        icon: Clock,
        label: "Reservation Time",

        value: `${formatTime(reservation.startTime)} – ${formatTime(
          reservation.endTime,
        )}`,
      },

      {
        key: "table",
        icon: Table2,
        label: "Table",

        value: `Table ${reservation.tableNumber}`,
      },

      {
        key: "guests",
        icon: Users,
        label: "Guests",

        value: `${reservation.guestCount} ${
          Number(reservation.guestCount) === 1 ? "person" : "people"
        }`,
      },
    ];

    if (reservation.note?.trim()) {
      result.push({
        key: "note",
        icon: FileText,
        label: "Special Note",
        value: reservation.note,
      });
    }

    if (reservation.checkedInAt) {
      const checkedInDate = new Date(reservation.checkedInAt);

      result.push({
        key: "checkin",
        icon: CheckCircle2,
        label: "Checked in",

        value: checkedInDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    return result;
  }, [reservation]);

  return (
    <>
      {/* =========================
          BACKDROP
      ========================== */}

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          duration: 0.15,
        }}
        className="
          fixed
          inset-0
          z-40
          bg-slate-950/25
          backdrop-blur-[2px]
        "
        onClick={() => {
          if (!loading) {
            onClose();
          }
        }}
      />

      {/* =========================
          PANEL
      ========================== */}

      <motion.aside
        initial={{
          x: "100%",
        }}
        animate={{
          x: 0,
        }}
        exit={{
          x: "100%",
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 38,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-detail-title"
        className="
          fixed
          bottom-0
          right-0
          top-0
          z-50
          flex
          w-full
          max-w-[420px]
          flex-col
          border-l
          border-slate-200
          bg-white
          shadow-2xl
        "
      >
        {/* =========================
            HEADER
        ========================== */}

        <header
          className="
            shrink-0
            border-b
            border-slate-200
            bg-white
            px-5
            pb-4
            pt-5
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-4
            "
          >
            <div className="min-w-0">
              {/* Status */}

              <span
                className={`
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-xs
                  font-semibold
                  ${status.badge}
                `}
              >
                <span
                  className={`
                    h-1.5
                    w-1.5
                    rounded-full
                    ${status.dot}
                  `}
                />

                {status.label}
              </span>

              <h2
                id="reservation-detail-title"
                className="
                  mt-3
                  truncate
                  text-xl
                  font-semibold
                  tracking-tight
                  text-slate-900
                "
              >
                {reservation.customerName}
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                Table {reservation.tableNumber}
                {" · "}
                {formatTime(reservation.startTime)}
                {" – "}
                {formatTime(reservation.endTime)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close reservation details"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-slate-400
                transition

                hover:bg-slate-100
                hover:text-slate-700

                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* =========================
            CONTENT
        ========================== */}

        <div
          className="
            flex-1
            overflow-y-auto
            px-5
            py-5
            scrollbar-thin
          "
        >
          {/* Customer */}

          <section
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
                p-4
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-teal-50
                "
              >
                <User
                  className="
                    h-5
                    w-5
                    text-teal-700
                  "
                />
              </div>

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Customer
                </p>

                <button
                  type="button"
                  onClick={() => onCustomerClick(reservation)}
                  className="
                    mt-0.5
                    max-w-full
                    truncate
                    text-left
                    text-sm
                    font-semibold
                    text-slate-900
                    transition

                    hover:text-teal-700
                  "
                >
                  {reservation.customerName}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onCustomerClick(reservation)}
                title="Customer history"
                aria-label="View customer history"
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  transition

                  hover:bg-slate-100
                  hover:text-slate-700
                "
              >
                <History className="h-4 w-4" />
              </button>
            </div>

            {/* Phone */}

            <div
              className="
                flex
                items-center
                gap-3
                border-t
                border-slate-100
                px-4
                py-3
              "
            >
              <Phone
                className="
                  h-4
                  w-4
                  shrink-0
                  text-slate-400
                "
              />

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <p className="text-xs text-slate-400">Phone number</p>

                <a
                  href={`tel:${reservation.phone}`}
                  className="
                    text-sm
                    font-medium
                    text-slate-700
                    transition

                    hover:text-teal-700
                    hover:underline
                  "
                >
                  {reservation.phone}
                </a>
              </div>
            </div>
          </section>

          {/* =========================
              RESERVATION DETAILS
          ========================== */}

          <section className="mt-6">
            <h3
              className="
                mb-2
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-slate-400
              "
            >
              Reservation details
            </h3>

            <div
              className="
                overflow-hidden
                rounded-xl
                border
                border-slate-200
              "
            >
              {fields.map(({ key, icon: Icon, label, value }) => (
                <div
                  key={key}
                  className="
                      flex
                      gap-3
                      border-b
                      border-slate-100
                      px-4
                      py-3.5
                      last:border-b-0
                    "
                >
                  <div
                    className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-slate-100
                      "
                  >
                    <Icon
                      className="
                          h-4
                          w-4
                          text-slate-500
                        "
                    />
                  </div>

                  <div
                    className="
                        min-w-0
                        flex-1
                      "
                  >
                    <p
                      className="
                          text-xs
                          text-slate-400
                        "
                    >
                      {label}
                    </p>

                    <p
                      className="
                          mt-0.5
                          whitespace-pre-wrap
                          break-words
                          text-sm
                          font-medium
                          text-slate-700
                        "
                    >
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* =========================
            ACTIONS
        ========================== */}

        <footer
          className="
            shrink-0
            border-t
            border-slate-200
            bg-white
            px-5
            py-4
          "
        >
          <div className="space-y-2">
            {/* Main Action */}

            {canCheckIn && (
              <button
                type="button"
                onClick={() => onCheckIn(reservation)}
                disabled={loading}
                className="
                  flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-teal-700
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition

                  hover:bg-teal-800

                  active:scale-[0.99]

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking in...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Check in guest
                  </>
                )}
              </button>
            )}

            {/* Secondary actions */}

            {(canEdit || canCancel) && (
              <div
                className="
                  grid
                  grid-cols-2
                  gap-2
                "
              >
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(reservation)}
                    disabled={loading}
                    className="
                      flex
                      h-10
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      text-sm
                      font-medium
                      text-slate-700
                      transition

                      hover:border-slate-300
                      hover:bg-slate-50

                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                )}

                {canCancel && (
                  <button
                    type="button"
                    onClick={() => onCancel(reservation)}
                    disabled={loading}
                    className="
                      flex
                      h-10
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-amber-200
                      bg-amber-50
                      text-sm
                      font-medium
                      text-amber-700
                      transition

                      hover:bg-amber-100

                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <Ban className="h-4 w-4" />
                    Cancel
                  </button>
                )}
              </div>
            )}

            {/* Danger Zone */}

            <button
              type="button"
              onClick={() => onDelete(reservation)}
              disabled={loading}
              className="
                flex
                h-10
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                text-sm
                font-medium
                text-red-600
                transition

                hover:bg-red-50

                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <Trash2 className="h-4 w-4" />
              Delete reservation
            </button>
          </div>
        </footer>
      </motion.aside>
    </>
  );
}

export default memo(ReservationDetailPanel);
