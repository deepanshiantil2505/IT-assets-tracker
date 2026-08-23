import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data);
    } catch {
      setError("You don't have access to this ticket.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(status: string) {
    await api.patch(`/tickets/${id}`, { status });
    load();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    await api.post(`/tickets/${id}/comments`, { body: comment });
    setComment("");
    load();
  }

  if (error) return <p className="p-8 text-sm text-critical">{error}</p>;
  if (!ticket) return <p className="p-8 text-sm text-ink/50">Loading…</p>;

  const canManage = user?.role === "ADMIN" || user?.role === "AGENT";

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <Link to="/tickets" className="text-sm text-accent">&larr; Back to tickets</Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-ink/50">#{ticket.id}</p>
            <h1 className="text-xl font-semibold">{ticket.title}</h1>
          </div>
          <span className="badge bg-blue-100 text-blue-700">{ticket.status.replace("_", " ")}</span>
        </div>
        <p className="text-sm text-ink/70 mt-4">{ticket.description}</p>

        <dl className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div><dt className="text-ink/50">Requester</dt><dd>{ticket.requester.name}</dd></div>
          <div><dt className="text-ink/50">Assignee</dt><dd>{ticket.assignee?.name ?? "Unassigned"}</dd></div>
          <div><dt className="text-ink/50">Priority</dt><dd>{ticket.priority}</dd></div>
          <div><dt className="text-ink/50">Asset</dt><dd>{ticket.asset?.name ?? "—"}</dd></div>
        </dl>

        {canManage && (
          <div className="flex gap-2 mt-6 pt-4 border-t border-line">
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                  ticket.status === s ? "bg-ink text-white border-ink" : "border-line text-ink/60"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <p className="text-sm font-semibold mb-4">Activity</p>
        <div className="space-y-4">
          {ticket.comments.length === 0 && <p className="text-sm text-ink/50">No comments yet.</p>}
          {ticket.comments.map((c: any) => (
            <div key={c.id} className="text-sm">
              <p className="font-medium">{c.author.name} <span className="text-ink/40 font-normal">· {new Date(c.createdAt).toLocaleString()}</span></p>
              <p className="text-ink/70">{c.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={addComment} className="flex gap-2 mt-4">
          <input className="input" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn-secondary shrink-0">Post</button>
        </form>
      </div>
    </div>
  );
}
