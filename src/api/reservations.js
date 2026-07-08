import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function toApp(row) {
  if (!row) return null;

  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    guestCount: row.guest_count,
    tableNumber: row.table_number,
    reservationDate: row.reservation_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    requestedTable: row.requested_table,
    note: row.note ?? "",
    checkedInAt: row.checked_in_at,
    createdAt: row.created_at,
  };
}

function toDb(data) {
  const db = {};

  if (data.customerName !== undefined) db.customer_name = data.customerName;
  if (data.phone !== undefined) db.phone = data.phone;
  if (data.guestCount !== undefined) db.guest_count = data.guestCount;
  if (data.tableNumber !== undefined) db.table_number = data.tableNumber;
  if (data.reservationDate !== undefined) db.reservation_date = data.reservationDate;
  if (data.startTime !== undefined) db.start_time = data.startTime;
  if (data.endTime !== undefined) db.end_time = data.endTime;
  if (data.status !== undefined) db.status = data.status;
  if (data.requestedTable !== undefined) db.requested_table = data.requestedTable;
  if (data.note !== undefined) db.note = data.note;
  if (data.checkedInAt !== undefined) db.checked_in_at = data.checkedInAt;

  return db;
}

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
    );
  }
}

export const Reservation = {
  async filter(criteria = {}) {
    ensureConfigured();

    let query = supabase.from("reservations").select("*");

    if (criteria.reservationDate) {
      query = query.eq("reservation_date", criteria.reservationDate);
    }

    if (criteria.phone) {
      query = query.eq("phone", criteria.phone);
    }

    const { data, error } = await query.order("start_time", { ascending: true });

    if (error) throw error;

    return (data ?? []).map(toApp);
  },

  async create(payload) {
    ensureConfigured();

    const { data, error } = await supabase
      .from("reservations")
      .insert(toDb(payload))
      .select("*")
      .single();

    if (error) throw error;

    return toApp(data);
  },

  async update(id, payload) {
    ensureConfigured();

    const { data, error } = await supabase
      .from("reservations")
      .update(toDb(payload))
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return toApp(data);
  },

  async delete(id) {
    ensureConfigured();

    const { error } = await supabase.from("reservations").delete().eq("id", id);

    if (error) throw error;
  },

  subscribe(callback) {
    if (!isSupabaseConfigured) {
      return () => {};
    }

    const channel = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => callback(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
