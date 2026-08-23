import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../api/client";

interface Summary {
  ticketsByStatus: { status: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  assetsByStatus: { status: string; count: number }[];
  totalAssets: number;
  openTickets: number;
  avgResolutionHours: number;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#0071e3",
  IN_PROGRESS: "#a16207",
  RESOLVED: "#0d9488",
  CLOSED: "#8e8e93",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50 font-medium">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load dashboard metrics."));
  }, []);

  if (error) return <p className="text-sm text-critical p-8">{error}</p>;
  if (!summary) return <p className="text-sm text-ink/50 p-8">Loading dashboard…</p>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Operations dashboard</h1>
        <p className="text-sm text-ink/50">Live snapshot of tickets and assets across the org.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open tickets" value={summary.openTickets} />
        <StatCard label="Total assets" value={summary.totalAssets} />
        <StatCard label="Avg. resolution" value={`${summary.avgResolutionHours}h`} />
        <StatCard
          label="Closed tickets"
          value={summary.ticketsByStatus.find((s) => s.status === "CLOSED")?.count ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm font-semibold mb-4">Tickets by status</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={summary.ticketsByStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80}>
                {summary.ticketsByStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#999"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold mb-4">Tickets by priority</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={summary.ticketsByPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
              <XAxis dataKey="priority" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#0071e3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-semibold mb-4">Assets by status</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.assetsByStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
              <XAxis type="number" allowDecimals={false} fontSize={12} />
              <YAxis type="category" dataKey="status" width={100} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#1d1d1f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
