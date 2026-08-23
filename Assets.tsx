import { useEffect, useState } from "react";
import { api, Asset } from "../api/client";

const STATUS_BADGE: Record<string, string> = {
  IN_USE: "bg-blue-100 text-blue-700",
  IN_STORAGE: "bg-gray-100 text-gray-600",
  IN_REPAIR: "bg-amber-100 text-amber-700",
  RETIRED: "bg-red-50 text-red-600",
};

export function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetTag: "", name: "", category: "", serialNumber: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await api.get("/assets", { params: search ? { search } : {} });
    setAssets(res.data.items);
  }

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/assets", form);
      setForm({ assetTag: "", name: "", category: "", serialNumber: "" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not create asset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Asset inventory</h1>
          <p className="text-sm text-ink/50">Laptops, monitors, and equipment tracked across the org.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add asset"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">Asset tag</label>
            <input className="input" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Category</label>
            <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Serial number</label>
            <input className="input" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          </div>
          {error && <p className="text-sm text-critical col-span-2">{error}</p>}
          <button className="btn-primary col-span-2" disabled={submitting}>{submitting ? "Saving…" : "Save asset"}</button>
        </form>
      )}

      <input className="input max-w-sm" placeholder="Search by name, tag, or serial…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-ink/50 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Tag</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {assets.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-mono text-xs">{a.assetTag}</td>
                <td className="px-4 py-3">{a.name}</td>
                <td className="px-4 py-3 text-ink/60">{a.category}</td>
                <td className="px-4 py-3 text-ink/60">{a.owner?.name ?? "—"}</td>
                <td className="px-4 py-3"><span className={`badge ${STATUS_BADGE[a.status]}`}>{a.status.replace("_", " ")}</span></td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No assets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
