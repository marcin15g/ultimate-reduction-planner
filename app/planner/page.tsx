"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MealPlan } from "@/lib/types";

export default function PlannerPage() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/plans");
    setPlans(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), start_date: startDate || undefined, days }),
    });
    const plan = await res.json();
    setName(""); setStartDate(new Date().toISOString().split("T")[0]);
    window.location.href = `/planner/${plan.id}`;
  }

  async function remove(id: number) {
    if (!confirm("Usunąć ten plan?")) return;
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Plany posiłków</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nowy plan</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Nazwa planu (np. Tydzień 16 czerwca)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100 dark:[color-scheme:dark]"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(14, Number(e.target.value))))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-16 text-center focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">dni</span>
          </div>
          <button
            onClick={create}
            disabled={!name.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            Utwórz i otwórz
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Ładowanie…</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Brak planów. Utwórz swój pierwszy plan powyżej.
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <Link href={`/planner/${p.id}`} className="font-medium text-gray-900 dark:text-gray-100 text-sm hover:text-green-700 dark:hover:text-green-400 transition-colors">
                  {p.name}
                </Link>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {p.start_date ? new Date(p.start_date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) : "Brak daty"}
                  {" · "}
                  {p.days} dni
                  {" · "}
                  Dodano {new Date(p.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                </p>
              </div>
              <Link
                href={`/planner/${p.id}/shopping`}
                className="text-xs text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 px-2 py-1 rounded border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                Lista zakupów
              </Link>
              <Link
                href={`/planner/${p.id}`}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Otwórz
              </Link>
              <button
                onClick={() => remove(p.id)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
