import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence } from "framer-motion";
import { Toaster as SonnerToaster, toast } from "sonner";

import { Reservation } from "@/api/reservations";

import TopNav from "@/components/dashboard/TopNav";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ColorLegend from "@/components/dashboard/ColorLegend";
import ReservationGrid from "@/components/dashboard/ReservationGrid";
import AddReservationModal from "@/components/dashboard/AddReservationModal";
import ReservationDetailPanel from "@/components/dashboard/ReservationDetailPanel";
import CustomerHistoryPanel from "@/components/dashboard/CustomerHistoryPanel";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

import { getTodayDate, checkAutoStatus } from "@/lib/reservationUtils";

const DailyStatsChart = lazy(
  () => import("@/components/dashboard/DailyStatsChart"),
);

const MemoSummaryCards = memo(SummaryCards);
const MemoColorLegend = memo(ColorLegend);
const MemoReservationGrid = memo(ReservationGrid);

const EMPTY_MODAL = {
  open: false,
  editing: null,
  prefill: null,
  isWalkIn: false,
};

const EMPTY_CONFIRM_DIALOG = {
  open: false,
  action: null,
  reservation: null,
  title: "",
  message: "",
  confirmLabel: "",
};

const AnalyticsSection = memo(function AnalyticsSection() {
  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      }
    >
      <DailyStatsChart />
    </Suspense>
  );
});

export default function Dashboard() {
  const [reservations, setReservations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalState, setModalState] = useState(EMPTY_MODAL);
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState(EMPTY_CONFIRM_DIALOG);

  const [pendingAction, setPendingAction] = useState(null);

  /*
   * refs
   */
  const reservationsRef = useRef([]);
  const requestIdRef = useRef(0);
  const refreshTimerRef = useRef(null);

  /*
   * Search ไม่จำเป็นต้องทำให้ Grid render
   * ใหม่ทุก key stroke ทันที
   */
  const deferredSearchQuery = useDeferredValue(searchQuery);

  /*
   * ทำให้ auto-status อ่าน reservations ล่าสุด
   * โดยไม่ต้องเอา reservations ไปใส่ dependency ของ interval
   */
  useEffect(() => {
    reservationsRef.current = reservations;
  }, [reservations]);

  /*
   * เก็บแค่ ID แทน reservation object
   *
   * เวลามี realtime update panel จะได้ข้อมูลล่าสุด
   * ไม่ค้างอยู่กับ object เก่า
   */
  const selectedReservation = useMemo(() => {
    if (!selectedReservationId) return null;

    return (
      reservations.find(
        (reservation) => reservation.id === selectedReservationId,
      ) ?? null
    );
  }, [reservations, selectedReservationId]);

  /*
   * ==========================
   * FETCH RESERVATIONS
   * ==========================
   */
  const fetchReservations = useCallback(
    async ({ silent = false } = {}) => {
      /*
       * ป้องกัน response เก่ากลับมาทับ response ใหม่
       */
      const requestId = ++requestIdRef.current;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setLoadError(null);

      try {
        const data = await Reservation.filter({
          reservationDate: selectedDate,
        });

        /*
         * ถ้ามี request ใหม่กว่าแล้ว
         * ไม่ต้องใช้ response ตัวนี้
         */
        if (requestId !== requestIdRef.current) return;

        setReservations(Array.isArray(data) ? data : []);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        console.error("Failed to fetch reservations:", error);

        setLoadError("Unable to load reservations. Please try again.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedDate],
  );

  /*
   * โหลดเมื่อเปลี่ยนวันที่
   */
  useEffect(() => {
    setSelectedReservationId(null);
    setCustomerHistory(null);

    fetchReservations();
  }, [fetchReservations]);

  /*
   * ==========================
   * DEBOUNCED REFRESH
   * ==========================
   *
   * realtime event หลาย event ที่มาติดกัน
   * จะถูกยุบเหลือ fetch เดียว
   */
  const queueRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      fetchReservations({ silent: true });
    }, 150);
  }, [fetchReservations]);

  /*
   * ==========================
   * REALTIME SUBSCRIPTION
   * ==========================
   */
  useEffect(() => {
    const unsubscribe = Reservation.subscribe(() => {
      queueRefresh();
    });

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [queueRefresh]);

  /*
   * ==========================
   * CLOCK + AUTO STATUS
   * ==========================
   *
   * สำคัญ:
   * ไม่เอา reservations มาเป็น dependency
   * เพราะจะทำให้ interval ถูก reset ทุกครั้งที่ data เปลี่ยน
   */
  useEffect(() => {
    let active = true;

    const tick = async () => {
      const now = new Date();

      setCurrentTime(now);

      /*
       * Auto status ควรทำเฉพาะ reservation วันนี้
       *
       * ไม่ควรเปิดวันที่พรุ่งนี้แล้วระบบไปแก้ status
       * reservation ของวันพรุ่งนี้ตามเวลาปัจจุบัน
       */
      if (selectedDate !== getTodayDate()) {
        return;
      }

      try {
        const changedCount = await checkAutoStatus(
          reservationsRef.current,
          now,
        );

        if (active && changedCount > 0) {
          queueRefresh();
        }
      } catch (error) {
        console.error("Auto status check failed:", error);
      }
    };

    const intervalId = window.setInterval(tick, 30_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedDate, queueRefresh]);

  /*
   * ==========================
   * MODAL
   * ==========================
   */

  const closeModal = useCallback(() => {
    setModalState(EMPTY_MODAL);
  }, []);

  const handleAddReservation = useCallback(() => {
    setModalState({
      open: true,
      editing: null,
      prefill: null,
      isWalkIn: false,
    });
  }, []);

  const handleCellClick = useCallback(
    (tableNumber, timeSlot, isWalkIn = false) => {
      setModalState({
        open: true,
        editing: null,

        prefill: {
          tableNumber,
          startTime: timeSlot,
          reservationDate: selectedDate,
        },

        isWalkIn,
      });
    },
    [selectedDate],
  );

  /*
   * ==========================
   * SAVE
   * ==========================
   */
  const handleSaveReservation = useCallback(
    async (data) => {
      /*
       * ป้องกัน double click
       */
      if (pendingAction) return;

      setPendingAction("save");

      try {
        if (modalState.editing) {
          await Reservation.update(modalState.editing.id, data);

          toast.success("Reservation updated successfully");
        } else {
          await Reservation.create(data);

          toast.success(
            modalState.isWalkIn
              ? "Walk-in seated successfully"
              : "Reservation created successfully",
          );
        }

        /*
         * ปิด modal เฉพาะตอน save สำเร็จ
         */
        closeModal();

        /*
         * debounce กับ realtime subscription
         */
        queueRefresh();
      } catch (error) {
        console.error("Failed to save reservation:", error);

        /*
         * ไม่ปิด modal
         * ผู้ใช้ไม่เสียข้อมูลที่กรอก
         */
        toast.error("Unable to save reservation. Please try again.");
      } finally {
        setPendingAction(null);
      }
    },
    [
      pendingAction,
      modalState.editing,
      modalState.isWalkIn,
      closeModal,
      queueRefresh,
    ],
  );

  /*
   * ==========================
   * CHECK-IN
   * ==========================
   */
  const handleCheckIn = useCallback(
    async (reservation) => {
      if (pendingAction) return;

      setPendingAction("check-in");

      try {
        await Reservation.update(reservation.id, {
          status: "CheckedIn",
          checkedInAt: new Date().toISOString(),
        });

        toast.success(`${reservation.customerName} checked in`);

        setSelectedReservationId(null);

        queueRefresh();
      } catch (error) {
        console.error("Failed to check in:", error);

        toast.error("Failed to check in");
      } finally {
        setPendingAction(null);
      }
    },
    [pendingAction, queueRefresh],
  );

  /*
   * ==========================
   * EDIT
   * ==========================
   */
  const handleEdit = useCallback((reservation) => {
    setSelectedReservationId(null);

    setModalState({
      open: true,
      editing: reservation,
      prefill: null,
      isWalkIn: false,
    });
  }, []);

  /*
   * ==========================
   * CANCEL / DELETE
   * ==========================
   */
  const handleCancel = useCallback((reservation) => {
    setConfirmDialog({
      open: true,
      action: "cancel",
      reservation,

      title: "Cancel Reservation",

      message:
        `Are you sure you want to cancel ` +
        `${reservation.customerName}'s reservation ` +
        `for Table ${reservation.tableNumber} ` +
        `at ${reservation.startTime}:00?`,

      confirmLabel: "Cancel Reservation",
    });
  }, []);

  const handleDelete = useCallback((reservation) => {
    setConfirmDialog({
      open: true,
      action: "delete",
      reservation,

      title: "Delete Reservation",

      message:
        `Are you sure you want to permanently delete ` +
        `${reservation.customerName}'s reservation? ` +
        `This action cannot be undone.`,

      confirmLabel: "Delete",
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(EMPTY_CONFIRM_DIALOG);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (pendingAction) return;

    const { action, reservation } = confirmDialog;

    if (!action || !reservation) return;

    setPendingAction(action);

    try {
      if (action === "cancel") {
        await Reservation.update(reservation.id, {
          status: "Cancelled",
        });

        toast.success("Reservation cancelled");
      }

      if (action === "delete") {
        await Reservation.delete(reservation.id);

        toast.success("Reservation deleted");
      }

      closeConfirmDialog();

      setSelectedReservationId(null);

      queueRefresh();
    } catch (error) {
      console.error(`Failed to ${action} reservation:`, error);

      toast.error(`Failed to ${action} reservation`);
    } finally {
      setPendingAction(null);
    }
  }, [pendingAction, confirmDialog, closeConfirmDialog, queueRefresh]);

  /*
   * ==========================
   * CUSTOMER
   * ==========================
   */
  const handleCustomerClick = useCallback((reservation) => {
    setCustomerHistory({
      name: reservation.customerName,
      phone: reservation.phone,
    });
  }, []);

  const handleSelectReservation = useCallback((reservation) => {
    setSelectedReservationId(reservation.id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SonnerToaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            color: "#0F172A",
            boxShadow: "0 12px 30px rgba(15,23,42,0.10)",
          },
        }}
      />

      <TopNav
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        onAddReservation={handleAddReservation}
        currentTime={currentTime}
      />

      <main
        className="
          mx-auto
          w-full
          max-w-[1600px]
          space-y-6
          px-4
          py-5
          sm:px-6
          lg:px-8
        "
      >
        <MemoSummaryCards reservations={reservations} />

        {loadError && (
          <div
            role="alert"
            className="
              flex
              flex-col
              gap-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <p className="font-medium text-red-900">
                Could not load reservations
              </p>

              <p className="text-sm text-red-700">{loadError}</p>
            </div>

            <button
              type="button"
              onClick={() => fetchReservations()}
              className="
                rounded-lg
                border
                border-red-300
                bg-white
                px-3
                py-2
                text-sm
                font-medium
                text-red-700
                transition
                hover:bg-red-100
              "
            >
              Try again
            </button>
          </div>
        )}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          <header
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-4
              border-b
              border-slate-200
              px-4
              py-4
              sm:px-5
            "
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-slate-900">
                  Reservations
                </h1>

                {refreshing && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-slate-100
                      px-2.5
                      py-1
                      text-xs
                      font-medium
                      text-slate-500
                    "
                  >
                    <span
                      className="
                        h-1.5
                        w-1.5
                        animate-pulse
                        rounded-full
                        bg-teal-600
                      "
                    />
                    Syncing
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {reservations.length}{" "}
                {reservations.length === 1 ? "booking" : "bookings"}
              </p>
            </div>

            <MemoColorLegend />
          </header>

          <MemoReservationGrid
            reservations={reservations}
            selectedDate={selectedDate}
            currentTime={currentTime}
            filter={filter}
            searchQuery={deferredSearchQuery}
            loading={loading}
            onSelectReservation={handleSelectReservation}
            onCellClick={handleCellClick}
          />
        </section>

        {/*
          Analytics ไม่แทรกระหว่าง
          Summary กับ Reservation Grid

          งานหลักของ user คือจัดการ booking
          analytics เป็นข้อมูลรอง
        */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Daily performance
            </h2>

            <p className="text-sm text-slate-500">
              Reservation activity and daily trends
            </p>
          </div>

          <AnalyticsSection />
        </section>
      </main>

      <AnimatePresence>
        {modalState.open && (
          <AddReservationModal
            key="reservation-modal"
            onClose={() => {
              if (pendingAction !== "save") {
                closeModal();
              }
            }}
            onSave={handleSaveReservation}
            editing={modalState.editing}
            prefill={modalState.prefill}
            isWalkIn={modalState.isWalkIn}
            allReservations={reservations}
            selectedDate={selectedDate}
            saving={pendingAction === "save"}
          />
        )}

        {selectedReservation && (
          <ReservationDetailPanel
            key={`reservation-${selectedReservation.id}`}
            reservation={selectedReservation}
            currentTime={currentTime}
            onClose={() => setSelectedReservationId(null)}
            onCheckIn={handleCheckIn}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onDelete={handleDelete}
            onCustomerClick={handleCustomerClick}
            loading={pendingAction === "check-in"}
          />
        )}

        {customerHistory && (
          <CustomerHistoryPanel
            key="customer-history"
            customer={customerHistory}
            onClose={() => setCustomerHistory(null)}
          />
        )}

        {confirmDialog.open && (
          <ConfirmDialog
            key="confirm-dialog"
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={confirmDialog.confirmLabel}
            onConfirm={handleConfirm}
            onCancel={() => {
              if (!pendingAction) {
                closeConfirmDialog();
              }
            }}
            loading={pendingAction === "cancel" || pendingAction === "delete"}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
