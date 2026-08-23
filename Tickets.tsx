import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Ticket } from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-teal-50 text-teal-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

export function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  async function loadTickets() {
    const res = await api.get("/tickets", { params: statusFilter ? { status: statusFilter } : {} });
    setTickets(res.data.items);
  }

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/tickets", { title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setShowForm(false);
      loadTickets();
    } finally {
      setSubmitting(false);
    }
  }

  const canManage = user?.role === "ADMIN" || user?.role === "AGENT";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{canManage ? "All tickets" : "Your tickets"}</h1>
          <p className="text-sm text-ink/50">
            {canManage ? "Every ticket raised across the organization." : "Requests you've raised with the IT desk."}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New ticket"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <button className="btn-primary" disabled={submitting}>{submitting ? "Submitting…" : "Submit ticket"}</button>
        </form>
      )}

      <div className="flex gap-2">
        {["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              statusFilter === s ? "bg-ink text-white border-ink" : "border-line text-ink/60"
            }`}
          >
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-line">
        {tickets.length === 0 && <p className="p-6 text-sm text-ink/50">No tickets to show yet.</p>}
        {tickets.map((t) => (
          <Link to={`/tickets/${t.id}`} key={t.id} className="flex items-center justify-between p-4 hover:bg-surface transition">
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-ink/50">
                #{t.id} · {t.requester.name} · {new Date(t.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
              <span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status.replace("_", " ")}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
