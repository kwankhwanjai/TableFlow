import { useState, useEffect, useCallback } from "react";
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
import DailyStatsChart from "@/components/dashboard/DailyStatsChart";

export default function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState({
    open: false,
    editing: null,
    prefill: null,
    isWalkIn: false,
  });
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    reservation: null,
  });

  const fetchReservations = useCallback(async () => {
    try {
      const data = await Reservation.filter({
        reservationDate: selectedDate,
      });
      setReservations(data);
    } catch (e) {
      console.error("Failed to fetch reservations:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    fetchReservations();
  }, [selectedDate]);

  useEffect(() => {
    const unsubscribe = Reservation.subscribe(() => fetchReservations());
    return unsubscribe;
  }, [selectedDate, fetchReservations]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkAutoStatus(reservations, now).then((count) => {
        if (count > 0) fetchReservations();
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [reservations, fetchReservations]);

  const handleAddReservation = () => {
    setModalState({
      open: true,
      editing: null,
      prefill: null,
      isWalkIn: false,
    });
  };

  const handleCellClick = (tableNumber, timeSlot, isWalkIn = false) => {
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
  };

  const handleSaveReservation = async (data) => {
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
    } catch (e) {
      toast.error("Failed to save reservation");
      console.error(e);
    }
    setModalState({
      open: false,
      editing: null,
      prefill: null,
      isWalkIn: false,
    });
    fetchReservations();
  };

  const handleCheckIn = async (reservation) => {
    try {
      await Reservation.update(reservation.id, {
        status: "CheckedIn",
        checkedInAt: new Date().toISOString(),
      });
      toast.success(`${reservation.customerName} checked in`);
    } catch (e) {
      toast.error("Failed to check in");
      console.error(e);
    }
    setSelectedReservation(null);
    fetchReservations();
  };

  const handleEdit = (reservation) => {
    setSelectedReservation(null);
    setModalState({
      open: true,
      editing: reservation,
      prefill: null,
      isWalkIn: false,
    });
  };

  const handleCancel = (reservation) => {
    setConfirmDialog({
      open: true,
      action: "cancel",
      reservation,
      title: "Cancel Reservation",
      message: `Are you sure you want to cancel ${reservation.customerName}'s reservation for Table ${reservation.tableNumber} at ${reservation.startTime}:00?`,
      confirmLabel: "Cancel Reservation",
    });
  };

  const handleDelete = (reservation) => {
    setConfirmDialog({
      open: true,
      action: "delete",
      reservation,
      title: "Delete Reservation",
      message: `Are you sure you want to permanently delete ${reservation.customerName}'s reservation? This action cannot be undone.`,
      confirmLabel: "Delete",
    });
  };

  const handleConfirm = async () => {
    const { action, reservation } = confirmDialog;
    try {
      if (action === "cancel") {
        await Reservation.update(reservation.id, {
          status: "Cancelled",
        });
        toast.success("Reservation cancelled");
      } else if (action === "delete") {
        await Reservation.delete(reservation.id);
        toast.success("Reservation deleted");
      }
    } catch (e) {
      toast.error(`Failed to ${action} reservation`);
      console.error(e);
    }
    setConfirmDialog({ open: false, action: null, reservation: null });
    setSelectedReservation(null);
    fetchReservations();
  };

  const handleCustomerClick = (reservation) => {
    setCustomerHistory({
      name: reservation.customerName,
      phone: reservation.phone,
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <SonnerToaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#FFF3B0",
            border: "1px solid rgba(51, 92, 103, 0.1)",
            color: "#335C67",
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

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        <SummaryCards reservations={reservations} />

        <DailyStatsChart />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display text-lg font-bold text-[#133951]">
            Reservation Grid
            <span className="ml-2 text-xs font-normal text-[#133951]/50">
              {reservations.length}{" "}
              {reservations.length === 1 ? "booking" : "bookings"} today
            </span>
          </h2>
          <ColorLegend />
        </div>

        <ReservationGrid
          reservations={reservations}
          selectedDate={selectedDate}
          currentTime={currentTime}
          filter={filter}
          searchQuery={searchQuery}
          loading={loading}
          onSelectReservation={setSelectedReservation}
          onCellClick={handleCellClick}
        />
      </main>

      <AnimatePresence>
        {modalState.open && (
          <AddReservationModal
            onClose={() =>
              setModalState({
                open: false,
                editing: null,
                prefill: null,
                isWalkIn: false,
              })
            }
            onSave={handleSaveReservation}
            editing={modalState.editing}
            prefill={modalState.prefill}
            isWalkIn={modalState.isWalkIn}
            allReservations={reservations}
            selectedDate={selectedDate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReservation && (
          <ReservationDetailPanel
            reservation={selectedReservation}
            currentTime={currentTime}
            onClose={() => setSelectedReservation(null)}
            onCheckIn={handleCheckIn}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onDelete={handleDelete}
            onCustomerClick={handleCustomerClick}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {customerHistory && (
          <CustomerHistoryPanel
            customer={customerHistory}
            onClose={() => setCustomerHistory(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog.open && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={confirmDialog.confirmLabel}
            onConfirm={handleConfirm}
            onCancel={() =>
              setConfirmDialog({ open: false, action: null, reservation: null })
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
