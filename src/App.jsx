import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin, Filter, MessageCircle, Search, Plus, Pencil, Trash2, X,
  Home, Compass, ShoppingBag, LayoutDashboard, Lock, LogOut, Calendar,
  Phone, Star, Tag, ChevronDown, Check, ClipboardList, Settings as SettingsIcon,
  Building2, ArrowLeft, Sparkles, AlertCircle
} from "lucide-react";
import { AuthProvider, useAuth } from "./lib/auth.jsx";
import {
  useListings,
  useGuidance,
  useShopSchedule,
  useBookings,
  adminListings,
  adminGuidance,
  adminSchedule,
} from "./lib/hooks.js";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  navy: "#173247",
  navyDeep: "#0F2534",
  saffron: "#E0913F",
  saffronDeep: "#C97627",
  teal: "#2F8F8A",
  tealDeep: "#22635F",
  sand: "#F6F1E6",
  sandDeep: "#EDE4D2",
  ink: "#20242A",
  inkSoft: "#5B6470",
  white: "#FFFFFF",
  line: "#DFD6C1",
  danger: "#B4432F",
};

const RATING_COLOR = {
  Excellent: C.teal,
  Good: C.saffron,
  Fair: C.inkSoft,
};

const DISTRICTS = [
  "Madrid", "Barcelona", "Valencia", "Málaga", "Sevilla", "Alicante",
  "Girona", "Baleares", "Canarias", "Granada", "Zaragoza", "Bilbao",
];

const TYPES = ["Buy", "Rent"];
const RATINGS = ["Excellent", "Good", "Fair"];
const STATUSES = ["Requested", "Contacted", "Confirmed", "Completed", "Cancelled"];

// Demo WhatsApp number (unchanged)
const DEMO_WHATSAPP = "34600123456";
const ADMIN_NAME = "Ahmed — Spain Concierge";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const eur = (n) => `€${Number(n || 0).toLocaleString("en-GB")}`;
function TilePattern({ opacity = 1, height = 14 }) {
  return (
    <svg viewBox="0 0 64 16" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height, display: "block", opacity }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`translate(${i * 16},0)`}>
          <rect width="16" height="16" fill={i % 2 === 0 ? C.teal : C.saffron} />
          <path d="M8 0 L16 8 L8 16 L0 8 Z" fill={i % 2 === 0 ? C.saffron : C.teal} />
        </g>
      ))}
    </svg>
  );
}

function Badge({ children, bg, fg = C.white }) {
  return (
    <span style={{ background: bg, color: fg }} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide">
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick, style, type = "button", full, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${full ? "w-full" : ""}`}
      style={{ background: C.saffron, color: C.white, ...style }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style, full, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${full ? "w-full" : ""}`}
      style={{ borderColor: C.line, color: C.navy, background: "transparent", ...style }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span style={{ color: C.saffronDeep, fontFamily: "Fraunces, serif" }} className="text-xs font-semibold uppercase tracking-[0.2em]">
        {children}
      </span>
      <span style={{ background: C.line }} className="h-px flex-1" />
    </div>
  );
}

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="mb-3 rounded-lg border p-3 text-sm" style={{ borderColor: C.danger, background: `${C.danger}15`, color: C.danger }}>
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 flex-none" />
        <span>{message}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal (generic add/edit form)                                       */
/* ------------------------------------------------------------------ */
function FormModal({ title, fields, initial, onCancel, onSave, loading = false }) {
  const [values, setValues] = useState(() => {
    const v = {};
    fields.forEach((f) => (v[f.name] = initial ? initial[f.name] ?? "" : f.default ?? ""));
    return v;
  });

  const set = (name, val) => setValues((prev) => ({ ...prev, [name]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onCancel}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ background: C.white }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.line }}>
          <h3 style={{ fontFamily: "Fraunces, serif", color: C.navy }} className="text-lg font-semibold">{title}</h3>
          <button onClick={onCancel} style={{ color: C.inkSoft }} disabled={loading}><X size={20} /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: C.inkSoft }}>{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: C.line, color: C.ink }}
                  disabled={loading}
                >
                  <option value="" disabled>Choose…</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: C.line, color: C.ink }}
                  disabled={loading}
                />
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, f.type === "number" ? e.target.value : e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: C.line, color: C.ink }}
                  disabled={loading}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 border-t px-5 py-4" style={{ borderColor: C.line }}>
          <GhostButton onClick={onCancel} full disabled={loading}>Cancel</GhostButton>
          <PrimaryButton full onClick={() => onSave(values)} disabled={loading}>
            <Check size={16} /> {loading ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Client: Places tab                                                  */
/* ------------------------------------------------------------------ */
function PlacesTab({ listings, waNumber, onContact, loading }) {
  const [district, setDistrict] = useState("All");
  const [type, setType] = useState("All");
  const [rating, setRating] = useState("All");
  const [maxPrice, setMaxPrice] = useState(500000);
  const [showFilters, setShowFilters] = useState(false);

  if (loading) {
    return (
      <div style={{ color: C.inkSoft }} className="text-center py-8">
        Loading listings…
      </div>
    );
  }

  const filtered = listings.filter((l) =>
    (district === "All" || l.district === district) &&
    (type === "All" || l.type === type) &&
    Number(l.price) <= Number(maxPrice)
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionLabel>Browse listings</SectionLabel>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="ml-4 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold sm:hidden"
          style={{ borderColor: C.line, color: C.navy }}
        >
          <Filter size={14} /> Filters
        </button>
      </div>

      <div className={`mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 ${showFilters ? "" : "hidden sm:grid"}`}>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.inkSoft }}>District</label>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full rounded-lg border px-2.5 py-2 text-sm" style={{ borderColor: C.line }}>
            <option>All</option>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.inkSoft }}>Buy or rent</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border px-2.5 py-2 text-sm" style={{ borderColor: C.line }}>
            <option>All</option>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.inkSoft }}>Max price: {eur(maxPrice)}</label>
          <input type="range" min={500} max={500000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No listings match those filters yet. Try widening your search." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <div key={l.id} className="overflow-hidden rounded-2xl border" style={{ borderColor: C.line, background: C.white }}>
              <div className="flex h-28 items-center justify-center text-5xl" style={{ background: C.sandDeep }}>🏡</div>
              <div className="p-4">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <Badge bg={C.navy}>{l.type}</Badge>
                </div>
                <h3 style={{ fontFamily: "Fraunces, serif", color: C.navy }} className="text-base font-semibold leading-snug">{l.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}><MapPin size={12} /> {l.district}</p>
                <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>{l.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span style={{ color: C.saffronDeep, fontFamily: "Fraunces, serif" }} className="text-lg font-bold">
                    {eur(l.price)}{l.type === "Rent" ? "/mo" : ""}
                  </span>
                </div>
                <PrimaryButton full style={{ marginTop: 12, background: C.teal }} onClick={() => onContact("Place", l)}>
                  <MessageCircle size={16} /> Ask on WhatsApp
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Client: Guidance tab                                                */
/* ------------------------------------------------------------------ */
function GuidanceTab({ guidance, onContact, loading }) {
  if (loading) {
    return (
      <div>
        <SectionLabel>Guided tours for Egyptian travellers</SectionLabel>
        <div style={{ color: C.inkSoft }} className="text-center py-8">
          Loading tours…
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Guided tours for Egyptian travellers</SectionLabel>
      <p className="mb-5 max-w-2xl text-sm" style={{ color: C.inkSoft }}>
        Arabic-speaking guidance at Spain's landmark sites — book directly on WhatsApp and the details are arranged with you personally.
      </p>
      {guidance.length === 0 ? (
        <EmptyState text="No guided tours listed yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guidance.map((g) => (
            <div key={g.id} className="rounded-2xl border p-4" style={{ borderColor: C.line, background: C.white }}>
              <div className="mb-2 text-4xl">🧭</div>
              <h3 style={{ fontFamily: "Fraunces, serif", color: C.navy }} className="text-base font-semibold leading-snug">{g.title}</h3>
              <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>{g.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span style={{ color: C.saffronDeep, fontFamily: "Fraunces, serif" }} className="text-lg font-bold">{eur(g.price)}<span className="text-xs font-normal" style={{ color: C.inkSoft }}> / person</span></span>
              </div>
              <PrimaryButton full style={{ marginTop: 12, background: C.teal }} onClick={() => onContact("Guidance", g)}>
                <MessageCircle size={16} /> Book on WhatsApp
              </PrimaryButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Client: Shop / Schedule tab                                         */
/* ------------------------------------------------------------------ */
function ShopTab({ schedule, onContact, loading }) {
  if (loading) {
    return (
      <div>
        <SectionLabel>Egyptian essentials — pop-up schedule</SectionLabel>
        <div style={{ color: C.inkSoft }} className="text-center py-8">
          Loading schedule…
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Egyptian essentials — pop-up schedule</SectionLabel>
      <p className="mb-5 max-w-2xl text-sm" style={{ color: C.inkSoft }}>
        Spices, halal groceries and everyday essentials, available at these stops or shipped to you. Order ahead on WhatsApp.
      </p>
      {schedule.length === 0 ? (
        <EmptyState text="No stops scheduled right now." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schedule.map((s) => (
            <div key={s.id} className="flex gap-4 rounded-2xl border p-4" style={{ borderColor: C.line, background: C.white }}>
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl text-2xl" style={{ background: C.sandDeep }}>🛍️</div>
              <div className="flex-1">
                <h3 style={{ fontFamily: "Fraunces, serif", color: C.navy }} className="text-base font-semibold">{s.day_of_week}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}><Calendar size={12} /> {s.opening_time} – {s.closing_time}</p>
                <PrimaryButton style={{ marginTop: 12, background: C.teal }} onClick={() => onContact("Shop", s)}>
                  <MessageCircle size={16} /> Contact
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center text-sm" style={{ borderColor: C.line, color: C.inkSoft }}>
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin: generic manage list                                          */
/* ------------------------------------------------------------------ */
function ManageList({ title, items, fields, itemLabel, onAdd, onUpdate, onDelete, loading }) {
  const [modal, setModal] = useState(null);
  const [opLoading, setOpLoading] = useState(false);

  const handleSave = async (values) => {
    setOpLoading(true);
    try {
      if (modal.mode === "add") {
        await onAdd(values);
      } else {
        await onUpdate(modal.item.id, values);
      }
      setModal(null);
    } finally {
      setOpLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionLabel>{title}</SectionLabel>
        <PrimaryButton onClick={() => setModal({ mode: "add" })} disabled={loading || opLoading}><Plus size={16} /> Add {itemLabel}</PrimaryButton>
      </div>

      {items.length === 0 ? (
        <EmptyState text={`No ${itemLabel.toLowerCase()} entries yet. Add the first one.`} />
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: C.line, background: C.white }}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: C.navy }}>
                  {it.title || it.siteName || it.day_of_week}
                </p>
                <p className="truncate text-xs" style={{ color: C.inkSoft }}>
                  {[it.district, it.type, it.date, it.time].filter(Boolean).join(" · ")}
                  {it.price !== undefined && it.price !== "" ? ` · ${eur(it.price)}` : ""}
                </p>
              </div>
              <div className="flex flex-none gap-2">
                <button onClick={() => setModal({ mode: "edit", item: it })} className="rounded-lg border p-2" style={{ borderColor: C.line, color: C.navy }} disabled={loading || opLoading}><Pencil size={15} /></button>
                <button onClick={() => onDelete(it.id)} className="rounded-lg border p-2" style={{ borderColor: C.line, color: C.danger }} disabled={loading || opLoading}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <FormModal
          title={modal.mode === "add" ? `Add ${itemLabel}` : `Edit ${itemLabel}`}
          fields={fields}
          initial={modal.item}
          onCancel={() => setModal(null)}
          onSave={handleSave}
          loading={opLoading}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin: Bookings                                                     */
/* ------------------------------------------------------------------ */
function BookingsTab({ bookings, onAdd, onUpdateStatus, onDelete, loading }) {
  const [modal, setModal] = useState(false);
  const [opLoading, setOpLoading] = useState(false);

  const bookingFields = [
    { name: "booking_type", label: "Category", type: "select", options: ["Place", "Guidance", "Shop"] },
    { name: "customer_name", label: "Client name", type: "text" },
    { name: "customer_phone", label: "Client phone", type: "text" },
    { name: "customer_email", label: "Client email", type: "text" },
    { name: "booking_date", label: "Booking date", type: "text" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  const handleSave = async (values) => {
    setOpLoading(true);
    try {
      await onAdd(values);
      setModal(false);
    } finally {
      setOpLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionLabel>Bookings</SectionLabel>
        <PrimaryButton onClick={() => setModal(true)} disabled={loading || opLoading}><Plus size={16} /> Add manually</PrimaryButton>
      </div>

      {bookings.length === 0 ? (
        <EmptyState text="No bookings yet. They'll appear here automatically when a client taps a WhatsApp button, or add one manually." />
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: C.line }}>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr style={{ background: C.sandDeep, color: C.navy }} className="text-left text-xs uppercase tracking-wide">
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Client</th>
                <th className="px-3 py-2.5">Phone</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={b.id} style={{ background: idx % 2 ? C.sand : C.white, borderTop: `1px solid ${C.line}` }}>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.inkSoft }}>
                    {new Date(b.booking_date || b.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5">{b.booking_type}</td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: C.navy }}>{b.customer_name}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: C.inkSoft }}>{b.customer_phone}</td>
                  <td className="px-3 py-2.5">
                    <select
                      value={b.status}
                      onChange={(e) => onUpdateStatus(b.id, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-xs"
                      style={{ borderColor: C.line }}
                      disabled={loading || opLoading}
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => onDelete(b.id)} style={{ color: C.danger }} disabled={loading || opLoading}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormModal
          title="Add booking manually"
          fields={bookingFields}
          onCancel={() => setModal(false)}
          onSave={handleSave}
          loading={opLoading}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin: Settings                                                     */
/* ------------------------------------------------------------------ */
function SettingsTab() {
  return (
    <div className="max-w-md">
      <SectionLabel>Settings</SectionLabel>
      <div className="space-y-4 rounded-2xl border p-5" style={{ borderColor: C.line, background: C.white }}>
        <p className="text-sm" style={{ color: C.inkSoft }}>
          WhatsApp number: <span className="font-semibold" style={{ color: C.navy }}>{DEMO_WHATSAPP}</span>
        </p>
        <p className="text-sm" style={{ color: C.inkSoft }}>
          Admin name: <span className="font-semibold" style={{ color: C.navy }}>{ADMIN_NAME}</span>
        </p>
      </div>
      <p className="mt-4 text-xs leading-relaxed" style={{ color: C.inkSoft }}>
        Settings are now managed in the Supabase database. To update WhatsApp number or admin name, contact the database administrator.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin: Login                                                        */
/* ------------------------------------------------------------------ */
function AdminLoginScreen() {
  const { signInWithPassword, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const result = await signInWithPassword(email, password);
    if (!result.success) {
      setError(result.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border p-6" style={{ borderColor: C.line, background: C.white }}>
        <div className="mb-4 flex items-center gap-2" style={{ color: C.navy }}>
          <Lock size={18} />
          <h2 style={{ fontFamily: "Fraunces, serif" }} className="text-lg font-semibold">Admin sign-in</h2>
        </div>
        <ErrorMessage message={error || authError} />
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
          placeholder="Email"
          className="mb-2 w-full rounded-lg border px-3 py-2.5 text-sm"
          style={{ borderColor: C.line }}
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
          placeholder="Password"
          className="mb-2 w-full rounded-lg border px-3 py-2.5 text-sm"
          style={{ borderColor: C.line }}
          disabled={loading}
        />
        <PrimaryButton full onClick={handleLogin} disabled={loading || !email || !password}>
          {loading ? "Signing in…" : "Sign in"}
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin portal                                                        */
/* ------------------------------------------------------------------ */
function AdminPortal() {
  const { session, signOut, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, addBooking, updateBookingStatus, deleteBooking } = useBookings();
  const [tab, setTab] = useState("bookings");
  const [opError, setOpError] = useState("");

  if (!session) {
    return <AdminLoginScreen />;
  }

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { key: "bookings", label: "Bookings", icon: ClipboardList },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-[75vh] flex-col sm:flex-row">
      <aside className="flex flex-none flex-row overflow-x-auto border-b sm:w-56 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r" style={{ borderColor: C.line, background: C.white }}>
        <div className="hidden items-center gap-2 border-b px-4 py-4 sm:flex" style={{ borderColor: C.line }}>
          <LayoutDashboard size={18} style={{ color: C.saffronDeep }} />
          <span style={{ fontFamily: "Fraunces, serif", color: C.navy }} className="font-semibold">Admin</span>
        </div>
        {navItems.map((n) => (
          <button
            key={n.key}
            onClick={() => setTab(n.key)}
            className="flex flex-none items-center gap-2 px-4 py-3 text-sm font-medium sm:flex-auto sm:border-l-4"
            style={{
              color: tab === n.key ? C.navy : C.inkSoft,
              background: tab === n.key ? C.sand : "transparent",
              borderColor: tab === n.key ? C.saffron : "transparent",
            }}
          >
            <n.icon size={16} /> {n.label}
          </button>
        ))}
        <button onClick={handleLogout} className="flex flex-none items-center gap-2 px-4 py-3 text-sm font-medium sm:mt-auto sm:border-t" style={{ color: C.danger, borderColor: C.line }} disabled={authLoading}>
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <div className="flex-1 p-5 sm:p-8">
        <ErrorMessage message={opError} />
        {tab === "bookings" && (
          <BookingsTab
            bookings={bookings}
            onAdd={async (values) => {
              const result = await addBooking(values);
              if (!result.success) {
                setOpError(result.error);
              }
            }}
            onUpdateStatus={async (id, status) => {
              const result = await updateBookingStatus(id, status);
              if (!result.success) {
                setOpError(result.error);
              }
            }}
            onDelete={async (id) => {
              const result = await deleteBooking(id);
              if (!result.success) {
                setOpError(result.error);
              }
            }}
            loading={bookingsLoading}
          />
        )}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Client Portal                                                       */
/* ------------------------------------------------------------------ */
function ClientPortal() {
  const { listings, loading: listingsLoading } = useListings();
  const { guidance, loading: guidanceLoading } = useGuidance();
  const { schedule, loading: scheduleLoading } = useShopSchedule();
  const [clientTab, setClientTab] = useState("places");

  const handleContact = (type, item) => {
    const number = DEMO_WHATSAPP.replace(/[^\d]/g, "");
    const name = item.title || item.day_of_week;
    const text = `Hello! I'm interested in: ${name}. I found this on the Spain tourism site.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const clientNav = [
    { key: "places", label: "Places", icon: Home },
    { key: "guidance", label: "Egyptian guidance", icon: Compass },
    { key: "shop", label: "Shop & schedule", icon: ShoppingBag },
  ];

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-10 pb-6">
        <h1 style={{ fontFamily: "Fraunces, serif", color: C.navy }} className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
          Find a place in Spain, a guide who speaks your language, and a taste of home — all one WhatsApp message away.
        </h1>
        <p className="mt-3 max-w-xl text-sm" style={{ color: C.inkSoft }}>
          Browse listings by district and price, book guided tours to Spain's landmark sites, and order Egyptian essentials — every request goes straight to your concierge on WhatsApp.
        </p>
      </section>

      {/* Nav tabs */}
      <div className="sticky top-0 z-10 border-y" style={{ background: C.sand, borderColor: C.line }}>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5">
          {clientNav.map((n) => (
            <button
              key={n.key}
              onClick={() => setClientTab(n.key)}
              className="flex flex-none items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold"
              style={{
                borderColor: clientTab === n.key ? C.saffron : "transparent",
                color: clientTab === n.key ? C.navy : C.inkSoft,
              }}
            >
              <n.icon size={15} /> {n.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {clientTab === "places" && <PlacesTab listings={listings} waNumber={DEMO_WHATSAPP} onContact={handleContact} loading={listingsLoading} />}
        {clientTab === "guidance" && <GuidanceTab guidance={guidance} onContact={handleContact} loading={guidanceLoading} />}
        {clientTab === "shop" && <ShopTab schedule={schedule} onContact={handleContact} loading={scheduleLoading} />}
      </main>

      <footer style={{ background: C.navyDeep }} className="mt-6">
        <TilePattern height={10} />
        <div className="mx-auto max-w-6xl px-5 py-6 text-center text-xs text-white/60">
          {ADMIN_NAME} · Prototype build
        </div>
      </footer>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Router component                                                    */
/* ------------------------------------------------------------------ */
function Router() {
  const [route, setRoute] = useState(() => {
    return window.location.pathname === "/admin" ? "admin" : "client";
  });

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname === "/admin" ? "admin" : "client");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, "", path);
    setRoute(path === "/admin" ? "admin" : "client");
  };

  return (
    <div style={{ background: C.sand, color: C.ink, fontFamily: "Inter, sans-serif", minHeight: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <header style={{ background: C.navy }} className="text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <Sparkles size={20} style={{ color: C.saffron }} />
            <span style={{ fontFamily: "Fraunces, serif" }} className="text-lg font-semibold">Spain, Simply</span>
          </button>
          {route === "admin" && (
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.saffron }}>Admin mode</span>
          )}
        </div>
        <TilePattern height={10} />
      </header>

      {route === "client" ? <ClientPortal /> : <AdminPortal />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root App with AuthProvider                                         */
/* ------------------------------------------------------------------ */
export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
