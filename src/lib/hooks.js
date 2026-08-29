import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

/**
 * Fetch listings from Supabase
 */
export function useListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("listings")
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false });
      if (err) throw err;
      setListings(data || []);
    } catch (e) {
      console.error("Failed to load listings:", e);
      setError(e?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return { listings, loading, error, refetch: loadListings };
}

/**
 * Fetch guidance (tours) from Supabase
 */
export function useGuidance() {
  const [guidance, setGuidance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGuidance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("guidance")
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false });
      if (err) throw err;
      setGuidance(data || []);
    } catch (e) {
      console.error("Failed to load guidance:", e);
      setError(e?.message || "Failed to load guidance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGuidance();
  }, [loadGuidance]);

  return { guidance, loading, error, refetch: loadGuidance };
}

/**
 * Fetch shop schedule from Supabase
 */
export function useShopSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("shop_schedule")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setSchedule(data || []);
    } catch (e) {
      console.error("Failed to load shop schedule:", e);
      setError(e?.message || "Failed to load shop schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  return { schedule, loading, error, refetch: loadSchedule };
}

/**
 * Fetch bookings (admin only)
 */
export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setBookings(data || []);
    } catch (e) {
      console.error("Failed to load bookings:", e);
      setError(e?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const addBooking = useCallback(
    async (booking) => {
      try {
        const { data, error: err } = await supabase
          .from("bookings")
          .insert([{
            customer_name: booking.customer_name || "",
            customer_phone: booking.customer_phone || "",
            customer_email: booking.customer_email || "",
            booking_type: booking.booking_type || "Manual entry",
            item_id: booking.item_id || null,
            booking_date: booking.booking_date || new Date().toISOString().split("T")[0],
            notes: booking.notes || "",
            status: booking.status || "pending",
          }])
          .select();
        if (err) throw err;
        setBookings((prev) => [...(data || []), ...prev]);
        return { success: true, data };
      } catch (e) {
        console.error("Failed to add booking:", e);
        return { success: false, error: e?.message || "Failed to add booking" };
      }
    },
    []
  );

  const updateBookingStatus = useCallback(
    async (id, status) => {
      try {
        const { error: err } = await supabase
          .from("bookings")
          .update({ status })
          .eq("id", id);
        if (err) throw err;
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        );
        return { success: true };
      } catch (e) {
        console.error("Failed to update booking:", e);
        return { success: false, error: e?.message || "Failed to update booking" };
      }
    },
    []
  );

  const deleteBooking = useCallback(
    async (id) => {
      try {
        const { error: err } = await supabase
          .from("bookings")
          .delete()
          .eq("id", id);
        if (err) throw err;
        setBookings((prev) => prev.filter((b) => b.id !== id));
        return { success: true };
      } catch (e) {
        console.error("Failed to delete booking:", e);
        return { success: false, error: e?.message || "Failed to delete booking" };
      }
    },
    []
  );

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: loadBookings,
    addBooking,
    updateBookingStatus,
    deleteBooking,
  };
}

/**
 * Admin operations for listings
 */
export const adminListings = {
  async create(data) {
    try {
      const { data: result, error: err } = await supabase
        .from("listings")
        .insert([{
          title: data.title,
          type: data.type,
          district: data.district,
          description: data.description,
          price: data.price,
          image_url: data.image_url || "",
          whatsapp_number: data.whatsapp_number || "",
          available: true,
        }])
        .select();
      if (err) throw err;
      return { success: true, data: result?.[0] };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to create listing" };
    }
  },

  async update(id, data) {
    try {
      const { error: err } = await supabase
        .from("listings")
        .update({
          title: data.title,
          type: data.type,
          district: data.district,
          description: data.description,
          price: data.price,
          image_url: data.image_url || "",
          whatsapp_number: data.whatsapp_number || "",
          available: data.available !== undefined ? data.available : true,
        })
        .eq("id", id);
      if (err) throw err;
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to update listing" };
    }
  },

  async delete(id) {
    try {
      const { error: err } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);
      if (err) throw err;
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to delete listing" };
    }
  },

  async toggleAvailable(id, available) {
    try {
      const { error: err } = await supabase
        .from("listings")
        .update({ available })
        .eq("id", id);
      if (err) throw err;
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to toggle availability" };
    }
  },
};

/**
 * Admin operations for guidance
 */
export const adminGuidance = {
  async create(data) {
    try {
      const { data: result, error: err } = await supabase
        .from("guidance")
        .insert([{
          title: data.title,
          description: data.description,
          price: data.price,
          duration: data.duration || "",
          image_url: data.image_url || "",
          whatsapp_number: data.whatsapp_number || "",
          available: true,
        }])
        .select();
      if (err) throw err;
      return { success: true, data: result?.[0] };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to create guidance" };
    }
  },

  async update(id, data) {
    try {
      const { error: err } = await supabase
        .from("guidance")
        .update({
          title: data.title,
          description: data.description,
          price: data.price,
          duration: data.duration || "",
          image_url: data.image_url || "",
          whatsapp_number: data.whatsapp_number || "",
          available: data.available !== undefined ? data.available : true,
        })
        .eq("id", id);
      if (err) throw err;
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to update guidance" };
    }
  },

  async delete(id) {
    try {
      const { error: err } = await supabase
        .from("guidance")
        .delete()
        .eq("id", id);
      if (err) throw err;
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to delete guidance" };
    }
  },

  async toggleAvailable(id, available) {
    try {
      const { error: err } = await supabase
        .from("guidance")
        .update({ available })
        .eq("id", id);
      if (err) throw err;
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to toggle availability" };
    }
  },
};

/**
 * Admin operations for shop schedule
 */
export const adminSchedule = {
  async create(data) {
    try {
      const { data: result, error: err } = await supabase
        .from("shop_schedule")
        .insert([{
          day_of_week: data.day_of_week,
          opening_time: data.opening_time,
          closing_time: data.closing_time,
          is_closed: data.is_closed || false,
        }])
        .select();
      if (err) throw err;
      return { success: true, data: result?.[0] };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to create schedule entry" };
    }
  },

  async update(id, data) {
    try {
      const { error: err } = await supabase
        .from("shop_schedule")
        .update({
          day_of_week: data.day_of_week,
          opening_time: data.opening_time,
          closing_time: data.closing_time,
          is_closed: data.is_closed || false,
        })
        .eq("id", id);
      if (err) throw err;
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to update schedule entry" };
    }
  },

  async delete(id) {
    try {
      const { error: err } = await supabase
        .from("shop_schedule")
        .delete()
        .eq("id", id);
      if (err) throw err;
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || "Failed to delete schedule entry" };
    }
  },
};
